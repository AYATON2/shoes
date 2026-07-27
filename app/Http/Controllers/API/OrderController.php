<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Address;
use App\Models\Notification;
use App\Models\Sku;
use App\Services\InvoiceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Order::with([
            'orderItems.sku.product',
            'shippingAddress',
            'payment',
            'user',
            'rider'
        ])->orderBy('created_at', 'desc');

        if ($request->has('archived') && $request->boolean('archived')) {
            $query->where('is_archived', true);
        } else {
            $query->where('is_archived', false);
        }

        if ($user->role === 'customer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'staff') {
            if ($user->logistic_id) {
                $query->where('logistics_id', $user->logistic_id);
            } else {
                $query->where('id', 0); // Unassigned staff see no orders
            }
        } elseif ($user->role === 'rider') {
            $query->where('rider_id', $user->id)
                  ->orWhere(function($q) use ($user) {
                      $q->whereNull('rider_id')
                        ->where('status', 'ready_for_pickup')
                        ->where('is_local', true);
                  });
        }
        // Admin sees all

        $perPage = (int) $request->input('per_page', 1000);
        $perPage = max(1, min($perPage, 5000));

        $orders = $query->paginate($perPage);
        return response()->json($orders);
    }

    public function show($id)
    {
        $order = Order::with('orderItems.sku.product', 'shippingAddress', 'payment')->findOrFail($id);
        $this->authorize('view', $order);
        return response()->json($order);
    }

    public function store(Request $request)
    {
        Log::info('Order creation request', [
            'payment_method' => $request->payment_method,
            'has_screenshot' => $request->hasFile('payment_screenshot'),
            'items_raw' => $request->items,
            'address_id' => $request->shipping_address_id
        ]);

        try {
            $items = $this->parseAndValidateItems($request->items);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], $e->getCode() ?: 422);
        }

        $validationRules = [
            'shipping_address_id' => 'required|exists:addresses,id',
            'payment_method' => 'required|in:gcash,cod',
            'logistics_id' => 'nullable|exists:logistics,id',
            'voucher_id' => 'nullable|exists:vouchers,id',
        ];

        if ($request->payment_method === 'gcash') {
            $validationRules['payment_screenshot'] = 'required|image|mimes:jpeg,png,jpg|max:5120';
            $validationRules['gcash_reference'] = 'required|string|max:100';
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            Log::error('Order validation failed', ['errors' => $validator->errors()]);
            return $this->validationErrorResponse($validator);
        }

        $address = Address::find($request->shipping_address_id);
        if (!$address) {
            return response()->json(['error' => 'Shipping address not found'], 404);
        }
        if ($address->user_id !== auth()->id()) {
            return response()->json(['error' => 'Shipping address does not belong to you'], 403);
        }

        DB::beginTransaction();
        try {
            $user = auth()->user();
            if (!$user) {
                throw new \Exception('User not authenticated', 401);
            }

            [$total, $orderItems] = $this->processOrderItems($items);
            [$logistics_id, $shipping_fee, $is_local] = $this->determineLogisticsAndFee($address, $request->logistics_id);
            $discount_amount = $this->calculateDiscount($request->voucher_id, $total);

            $order = Order::create([
                'user_id' => $user->id,
                'total' => max(0, ($total - $discount_amount) + $shipping_fee),
                'status' => 'received',
                'shipping_address_id' => $request->shipping_address_id,
                'payment_method' => $request->payment_method,
                'shipping_fee' => $shipping_fee,
                'discount_amount' => $discount_amount,
                'voucher_id' => $request->voucher_id,
                'logistics_id' => $logistics_id,
                'rider_id' => null,
                'is_local' => $is_local,
            ]);

            foreach ($orderItems as $item) {
                $item['order_id'] = $order->id;
                OrderItem::create($item);
            }

            $this->handlePaymentCreation($request, $order, $total, $shipping_fee);
            InvoiceService::generateInvoice($order);

            DB::commit();
            return response()->json($order->load('orderItems.sku.product', 'shippingAddress', 'payment'), 201);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Order creation failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            $status = $e->getCode();
            $status = ($status >= 400 && $status < 600) ? $status : 500;
            return response()->json([
                'error' => 'Order failed',
                'message' => $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null
            ], $status);
        }
    }

    private function parseAndValidateItems($itemsRaw)
    {
        $items = $itemsRaw;
        if (is_string($items)) {
            $items = json_decode($items, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new \Exception('Invalid items JSON format', 422);
            }
        }
        
        if (!$items || !is_array($items) || count($items) === 0) {
            throw new \Exception('Items are required and must be an array', 422);
        }

        foreach ($items as $index => $item) {
            if (!isset($item['sku_id']) || !isset($item['quantity'])) {
                throw new \Exception("Item at index {$index} is missing sku_id or quantity", 422);
            }
            if (!is_numeric($item['sku_id']) || !is_numeric($item['quantity'])) {
                throw new \Exception("Item at index {$index} has invalid sku_id or quantity format", 422);
            }
            if ($item['quantity'] < 1) {
                throw new \Exception("Item at index {$index} must have quantity of at least 1", 422);
            }
        }

        return $items;
    }

    private function processOrderItems(array $items)
    {
        $total = 0;
        $orderItems = [];

        foreach ($items as $item) {
            $sku = Sku::find($item['sku_id']);
            if (!$sku) {
                throw new \Exception("SKU not found: {$item['sku_id']}", 404);
            }
            if ($sku->stock < $item['quantity']) {
                throw new \Exception("Insufficient stock for SKU {$item['sku_id']}. Available: {$sku->stock}, Requested: {$item['quantity']}", 400);
            }
            $price = $sku->product->price;
            $total += $price * $item['quantity'];
            $orderItems[] = [
                'sku_id' => $item['sku_id'],
                'quantity' => $item['quantity'],
                'price' => $price,
            ];
            $sku->decrement('stock', $item['quantity']);
        }

        return [$total, $orderItems];
    }

    private function determineLogisticsAndFee($address, $logistics_id)
    {
        $shipping_fee = 50.00;
        $is_local = false;

        $city = strtolower($address->city);
        if (str_contains($city, 'butuan') || str_contains($city, 'agusan')) {
            $is_local = true;
            $localLogistics = \App\Models\Logistics::where('is_local', true)->first();
            $logistics_id = $localLogistics ? $localLogistics->id : $logistics_id;
            $shipping_fee = $localLogistics ? $localLogistics->base_cost : $shipping_fee;
        } else {
            if ($logistics_id) {
                $selectedLogistics = \App\Models\Logistics::find($logistics_id);
                $shipping_fee = $selectedLogistics ? $selectedLogistics->base_cost : $shipping_fee;
            }
        }

        return [$logistics_id, $shipping_fee, $is_local];
    }

    private function calculateDiscount($voucher_id, $total)
    {
        if (!$voucher_id) return 0;
        
        $voucher = \App\Models\Voucher::find($voucher_id);
        if ($voucher && $voucher->is_active && (!$voucher->expires_at || $voucher->expires_at->isFuture())) {
            if ($total >= $voucher->min_spend) {
                if ($voucher->type === 'percentage') {
                    return $total * ($voucher->value / 100);
                } else {
                    return $voucher->value;
                }
            }
        }
        return 0;
    }

    private function handlePaymentCreation(Request $request, Order $order, $total, $shipping_fee)
    {
        $paymentData = [
            'order_id' => $order->id,
            'method' => $request->payment_method,
            'amount' => $total + $shipping_fee,
            'status' => 'pending',
        ];

        if ($request->payment_method === 'gcash' && $request->hasFile('payment_screenshot')) {
            $file = $request->file('payment_screenshot');
            $filename = time() . '_' . $order->id . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('payment_proofs'), $filename);
            $paymentData['payment_screenshot'] = 'payment_proofs/' . $filename;
            $paymentData['gcash_reference'] = $request->gcash_reference;
        } elseif ($request->payment_method === 'cod') {
            $paymentData['status'] = 'completed';
        }

        Payment::create($paymentData);
    }

    public function update(Request $request, $id)
    {
        $order = Order::with('payment')->findOrFail($id);
        $user = $request->user();
        $requestedStatus = $request->input('status');

        // Authorization: Allow customer to only cancel their own orders, staff/admin can cancel any order
        if ($requestedStatus === 'cancelled') {
            // Customer can cancel their own orders, staff can cancel orders for their products, admin can cancel any
            $isAuthorized = $user->role === 'admin' || 
                           ($user->role === 'customer' && $order->user_id === $user->id) ||
                           ($user->role === 'staff' && (
                               ($user->logistic_id && $order->logistics_id === $user->logistic_id) ||
                               $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                                   $q->where('seller_id', $user->id);
                               })->exists()
                           ));
            
            if (!$isAuthorized) {
                return $this->unauthorizedResponse();
            }
        } else {
            // Only admin, staff, or riders can update order workflow
            $isAuthorized = $user->role === 'admin' || 
                            ($user->role === 'staff' && (
                                ($user->logistic_id && $order->logistics_id === $user->logistic_id) ||
                                $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                                    $q->where('seller_id', $user->id);
                                })->exists()
                            )) ||
                            ($user->role === 'rider' && ($order->rider_id === $user->id || ($order->rider_id === null && $order->is_local)));

            if (!$isAuthorized) {
                return $this->unauthorizedResponse();
            }
        }

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|in:received,quality_check,ready_for_pickup,shipped,delivered,cancelled,returned',
            'rider_id' => 'nullable|exists:users,id'
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        $oldStatus = $order->status;
        $newStatus = $request->status;
        
        // Check if GCash payment needs to be verified before moving to ready_for_pickup
        if ($newStatus === 'ready_for_pickup' && $order->payment_method === 'gcash') {
            $payment = $order->payment;
            if (!$payment || $payment->status !== 'completed' || !$payment->verified_at) {
                return response()->json([
                    'error' => 'GCash payment must be verified before moving to ready for pickup'
                ], 400);
            }
        }

        if ($request->has('rider_id')) {
            $order->rider_id = $request->rider_id;
        } elseif ($user->role === 'rider' && $order->rider_id === null && $newStatus === 'shipped') {
            $order->rider_id = $user->id;
        }
        
        if ($newStatus) {
            $order->status = $newStatus;
        }
        
        $order->save();

        // Create notification for customer
        if ($oldStatus !== $newStatus) {
            $statusMessages = [
                'received' => 'Your order has been received',
                'quality_check' => 'Your order is undergoing quality check',
                'ready_for_pickup' => 'Your order is ready for pick up',
                'shipped' => 'Your order is out for delivery',
                'delivered' => 'Your order has been delivered',
                'cancelled' => 'Your order has been cancelled',
                'returned' => 'Your order has been returned'
            ];

            $message = $statusMessages[$newStatus] ?? "Order status updated to {$newStatus}";

            if (in_array($newStatus, ['shipped', 'delivered', 'cancelled'], true)) {
                $order->loadMissing('orderItems.sku.product.sales');
                $lines = [];

                foreach ($order->orderItems as $item) {
                    $product = $item->sku->product;
                    $productName = $product ? $product->name : 'Unknown product';
                    $price = number_format((float) $item->price, 2);
                    $line = "- {$productName} x{$item->quantity} - Price: PHP {$price}";

                    if ($product && $product->sales) {
                        $activeSale = $product->sales->first(function ($sale) {
                            return $sale->isCurrentlyActive();
                        });

                        if ($activeSale) {
                            $saleInfo = '';
                            if ($activeSale->discount_percentage) {
                                $saleInfo = $activeSale->discount_percentage . '% off';
                            } elseif ($activeSale->discount_amount) {
                                $saleInfo = 'Save PHP ' . number_format((float) $activeSale->discount_amount, 2);
                            }

                            $salePrice = number_format((float) $activeSale->sale_price, 2);
                            $line .= " (Sale: {$saleInfo}, Sale price: PHP {$salePrice})";
                        }
                    }

                    $lines[] = $line;
                }

                if (!empty($lines)) {
                    $message .= "\n\nItems:\n" . implode("\n", $lines);
                }
            }

            Notification::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'title' => 'Order Status Update',
                'message' => $message,
                'type' => 'order_status'
            ]);
        }

        return response()->json($order);
    }

    public function invoice($id)
    {
        $order = Order::with('orderItems.sku.product', 'shippingAddress', 'payment', 'user')->findOrFail($id);
        $this->authorize('view', $order);

        // Return invoice data
        return response()->json([
            'order' => $order,
            'items' => $order->orderItems,
            'total' => $order->total,
            'shipping_fee' => $order->shipping_fee,
        ]);
    }

    public function verifyPayment(Request $request, $orderId)
    {
        $order = Order::with('payment')->findOrFail($orderId);
        $user = $request->user();

        // Only staff or admin can verify payment
        if (!($user->role === 'admin' || 
              ($user->role === 'staff' && (
                  ($user->logistic_id && $order->logistics_id === $user->logistic_id) ||
                  $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                      $q->where('seller_id', $user->id);
                  })->exists()
              )))) {
            return $this->unauthorizedResponse();
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        $payment = $order->payment;
        if (!$payment) {
            return response()->json(['error' => 'Payment not found'], 404);
        }

        if ($request->action === 'approve') {
            $payment->update([
                'status' => 'completed',
                'verified_at' => now(),
                'verified_by' => $user->id,
            ]);

            // Create notification for customer
            Notification::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'title' => 'Payment Verified',
                'message' => 'Your GCash payment has been verified. Your order will proceed to ready for pickup.',
                'type' => 'payment_verified'
            ]);

            return response()->json(['message' => 'Payment verified successfully', 'payment' => $payment]);
        } else {
            $payment->update([
                'status' => 'failed',
            ]);

            // Optionally cancel the order or set it to a special status
            $order->update(['status' => 'cancelled']);

            // Create notification for customer
            Notification::create([
                'user_id' => $order->user_id,
                'order_id' => $order->id,
                'title' => 'Payment Rejected',
                'message' => 'Your GCash payment proof was rejected. Please contact support or create a new order.',
                'type' => 'payment_rejected'
            ]);

            return response()->json(['message' => 'Payment rejected', 'payment' => $payment]);
        }
    }

    public function archive($id)
    {
        $order = Order::findOrFail($id);
        $order->update(['is_archived' => !$order->is_archived]);
        return response()->json(['message' => $order->is_archived ? 'Order archived' : 'Order unarchived']);
    }
}