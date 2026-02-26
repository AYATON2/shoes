<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Address;
use App\Models\Notification;
use App\Models\Sku;
use Illuminate\Http\Request;
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
            'user'
        ])->orderBy('created_at', 'desc');

        if ($user->role === 'customer') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'seller') {
            // Sellers see orders for their products
            $query->whereHas('orderItems.sku.product', function ($q) use ($user) {
                $q->where('seller_id', $user->id);
            });
        }
        // Admin sees all

        $orders = $query->paginate(20);
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
        // Log incoming request for debugging
        \Log::info('Order creation request', [
            'payment_method' => $request->payment_method,
            'has_screenshot' => $request->hasFile('payment_screenshot'),
            'items_raw' => $request->items,
            'address_id' => $request->shipping_address_id
        ]);

        // Handle items sent as JSON string from FormData
        $items = $request->items;
        if (is_string($items)) {
            $items = json_decode($items, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                return response()->json(['error' => 'Invalid items JSON format'], 422);
            }
        }
        
        // Validate items structure first
        if (!$items || !is_array($items) || count($items) === 0) {
            return response()->json(['error' => 'Items are required and must be an array'], 422);
        }

        foreach ($items as $index => $item) {
            if (!isset($item['sku_id']) || !isset($item['quantity'])) {
                return response()->json(['error' => "Item at index {$index} is missing sku_id or quantity"], 422);
            }
            if (!is_numeric($item['sku_id']) || !is_numeric($item['quantity'])) {
                return response()->json(['error' => "Item at index {$index} has invalid sku_id or quantity format"], 422);
            }
            if ($item['quantity'] < 1) {
                return response()->json(['error' => "Item at index {$index} must have quantity of at least 1"], 422);
            }
        }
        
        $validationRules = [
            'shipping_address_id' => 'required|exists:addresses,id',
            'payment_method' => 'required|in:gcash,cod',
        ];

        // Validate file upload for GCash
        if ($request->payment_method === 'gcash') {
            $validationRules['payment_screenshot'] = 'required|image|mimes:jpeg,png,jpg|max:5120';
            $validationRules['gcash_reference'] = 'required|string|max:100';
        }

        $validator = Validator::make($request->all(), $validationRules);

        if ($validator->fails()) {
            \Log::error('Order validation failed', ['errors' => $validator->errors()]);
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Additional check: Verify address belongs to user
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
                DB::rollback();
                return response()->json(['error' => 'User not authenticated'], 401);
            }
            
            $total = 0;
            $orderItems = [];

            foreach ($items as $item) {
                $sku = Sku::find($item['sku_id']);
                if (!$sku) {
                    DB::rollback();
                    return response()->json(['error' => "SKU not found: {$item['sku_id']}"], 404);
                }
                if ($sku->stock < $item['quantity']) {
                    DB::rollback();
                    return response()->json(['error' => "Insufficient stock for SKU {$item['sku_id']}. Available: {$sku->stock}, Requested: {$item['quantity']}"], 400);
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

            $shipping_fee = 50.00; // Simple fixed fee

            $order = Order::create([
                'user_id' => $user->id,
                'total' => $total + $shipping_fee,
                'status' => 'received',
                'shipping_address_id' => $request->shipping_address_id,
                'payment_method' => $request->payment_method,
                'shipping_fee' => $shipping_fee,
            ]);

            foreach ($orderItems as $item) {
                $item['order_id'] = $order->id;
                OrderItem::create($item);
            }

            // Handle payment screenshot upload for GCash
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

            DB::commit();
            return response()->json($order->load('orderItems.sku.product', 'shippingAddress', 'payment'), 201);
        } catch (\Exception $e) {
            DB::rollback();
            \Log::error('Order creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Order failed',
                'message' => $e->getMessage(),
                'details' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $order = Order::with('payment')->findOrFail($id);
        $user = $request->user();
        $requestedStatus = $request->input('status');

        // Authorization: Allow customer to only cancel their own orders, sellers/admin can cancel any order
        if ($requestedStatus === 'cancelled') {
            // Customer can cancel their own orders, seller can cancel orders for their products, admin can cancel any
            $isAuthorized = $user->role === 'admin' || 
                           ($user->role === 'customer' && $order->user_id === $user->id) ||
                           ($user->role === 'seller' && $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                               $q->where('seller_id', $user->id);
                           })->exists());
            
            if (!$isAuthorized) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        } else {
            // Only admin or seller can update order workflow (received -> quality_check -> shipped -> delivered)
            if (!($user->role === 'admin' || 
                  ($user->role === 'seller' && $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                      $q->where('seller_id', $user->id);
                  })->exists()))) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:received,quality_check,shipped,delivered,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $oldStatus = $order->status;
        $newStatus = $request->status;
        
        // Check if GCash payment needs to be verified before moving to quality_check
        if ($newStatus === 'quality_check' && $order->payment_method === 'gcash') {
            $payment = $order->payment;
            if (!$payment || $payment->status !== 'completed' || !$payment->verified_at) {
                return response()->json([
                    'error' => 'GCash payment must be verified before moving to quality check'
                ], 400);
            }
        }
        
        $order->update($request->only('status'));

        // Create notification for customer
        if ($oldStatus !== $newStatus) {
            $statusMessages = [
                'received' => 'Your order has been received',
                'quality_check' => 'Your order is being quality checked',
                'shipped' => 'Your order has been shipped',
                'delivered' => 'Your order has been delivered',
                'cancelled' => 'Your order has been cancelled'
            ];

            $message = $statusMessages[$newStatus] ?? "Order status updated to {$newStatus}";

            if (in_array($newStatus, ['shipped', 'delivered', 'cancelled'], true)) {
                $order->loadMissing('orderItems.sku.product.sales');
                $now = now();
                $lines = [];

                foreach ($order->orderItems as $item) {
                    $product = $item->sku->product;
                    $productName = $product ? $product->name : 'Unknown product';
                    $price = number_format((float) $item->price, 2);
                    $line = "- {$productName} x{$item->quantity} - Price: PHP {$price}";

                    if ($product && $product->sales) {
                        $activeSale = $product->sales->first(function ($sale) use ($now) {
                            return $sale->is_active && $now->between($sale->start_date, $sale->end_date);
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

        // Only seller or admin can verify payment
        if (!($user->role === 'admin' || 
              ($user->role === 'seller' && $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                  $q->where('seller_id', $user->id);
              })->exists()))) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
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
                'message' => 'Your GCash payment has been verified. Your order will proceed to quality check.',
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
}