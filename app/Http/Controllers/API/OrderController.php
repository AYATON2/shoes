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
        $query = Order::with('orderItems.sku.product', 'shippingAddress', 'payment');

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
        
        // Check authorization - allow admin or seller of products in the order
        $user = $request->user();
        if (!($user->role === 'admin' || 
              ($user->role === 'seller' && $order->orderItems()->whereHas('sku.product', function ($q) use ($user) {
                  $q->where('seller_id', $user->id);
              })->exists()))) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:received,quality_check,shipped,delivered',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $order->update($request->only('status'));
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