<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class RiderController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin,staff'])->except(['myOrders']);
        $this->middleware(['auth:sanctum', 'role:rider'])->only(['myOrders']);
    }

    public function index()
    {
        return response()->json(User::where('role', 'rider')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'city' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $rider = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'rider',
            'city' => $request->city,
            'active' => true,
            'approved' => true,
        ]);

        return response()->json($rider, 201);
    }

    public function myOrders(Request $request)
    {
        $rider = $request->user();
        $riderId = $rider->id;
        $riderCity = strtolower($rider->city);
        
        $orders = Order::where(function($query) use ($riderId, $riderCity) {
                // Orders assigned to this rider
                $query->where('rider_id', $riderId)
                      ->orWhere(function($subq) use ($riderCity) {
                          // Unassigned local orders ready for pickup in rider's city
                          $subq->whereNull('rider_id')
                               ->where('status', 'ready_for_pickup')
                               ->where('is_local', true)
                               ->whereHas('shippingAddress', function($q) use ($riderCity) {
                                   $q->whereRaw('LOWER(city) LIKE ?', ["%{$riderCity}%"]);
                               });
                      });
            })
            ->where('is_archived', false)
            ->with(['shippingAddress', 'user', 'orderItems.sku.product'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function acceptOrder(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $user = $request->user();

        // Check if order is eligible for rider pick up
        if ($order->status !== 'ready_for_pickup') {
            return response()->json(['error' => 'Order is not ready for pickup'], 400);
        }

        if ($order->rider_id !== null) {
            return response()->json(['error' => 'Order is already assigned to another rider'], 400);
        }

        // Only riders can accept orders
        if ($user->role !== 'rider') {
            return response()->json(['error' => 'Only riders can accept orders'], 403);
        }

        $order->update([
            'rider_id' => $user->id,
            'status' => 'shipped'
        ]);

        return response()->json([
            'message' => 'Order accepted and status updated to shipped',
            'order' => $order->load(['shippingAddress', 'user', 'orderItems.sku.product'])
        ]);
    }
}
