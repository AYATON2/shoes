<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\ReturnProduct;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReturnController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum']);
        $this->middleware(['role:admin,staff'])->only(['updateStatus']);
    }

    public function index(Request $request)
    {
        if ($request->user()->role === 'admin' || $request->user()->role === 'staff') {
            return response()->json(ReturnProduct::with(['user', 'order.orderItems.sku.product'])->orderBy('created_at', 'desc')->get());
        }

        return response()->json(ReturnProduct::where('user_id', $request->user()->id)->with('order')->orderBy('created_at', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'reason' => 'required|string',
            'proof_image' => 'required|image|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $proof_path = null;
        if ($request->hasFile('proof_image')) {
            $file = $request->file('proof_image');
            $filename = time() . '_return_' . $request->order_id . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('returns'), $filename);
            $proof_path = 'returns/' . $filename;
        }

        $return = ReturnProduct::create([
            'order_id' => $request->order_id,
            'user_id' => $request->user()->id,
            'reason' => $request->reason,
            'proof_image' => $proof_path,
            'status' => 'pending',
        ]);

        return response()->json($return, 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,rejected,completed',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $return = ReturnProduct::findOrFail($id);
        $return->update(['status' => $request->status]);

        return response()->json($return);
    }
}
