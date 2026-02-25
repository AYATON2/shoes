<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Address;
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
        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.sku_id' => 'required|exists:skus,id',
            'items.*.quantity' => 'required|integer|min:1',
            'shipping_address_id' => 'required|exists:addresses,id',
            'payment_method' => 'required|in:gcash,cod',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        DB::beginTransaction();
        try {
            $user = auth()->user();
            $total = 0;
            $orderItems = [];

            foreach ($request->items as $item) {
                $sku = \App\Models\Sku::find($item['sku_id']);
                if ($sku->stock < $item['quantity']) {
                    return response()->json(['error' => 'Insufficient stock'], 400);
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

            Payment::create([
                'order_id' => $order->id,
                'method' => $request->payment_method,
                'amount' => $total + $shipping_fee,
                'status' => $request->payment_method === 'cod' ? 'pending' : 'completed',
            ]);

            DB::commit();
            return response()->json($order->load('orderItems.sku.product', 'shippingAddress', 'payment'), 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Order failed'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $order = Order::findOrFail($id);
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

            \App\Models\Notification::create([
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
}