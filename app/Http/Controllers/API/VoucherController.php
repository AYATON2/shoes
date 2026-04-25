<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VoucherController extends Controller
{
    public function index()
    {
        return response()->json(Voucher::latest()->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|unique:vouchers',
            'type' => 'required|in:fixed,percentage',
            'value' => 'required|numeric|min:0',
            'min_spend' => 'nullable|numeric|min:0',
            'expires_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $voucher = Voucher::create($request->all());
        return response()->json($voucher, 201);
    }

    public function show(Voucher $voucher)
    {
        return response()->json($voucher);
    }

    public function update(Request $request, Voucher $voucher)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'sometimes|required|string|unique:vouchers,code,' . $voucher->id,
            'type' => 'sometimes|required|in:fixed,percentage',
            'value' => 'sometimes|required|numeric|min:0',
            'min_spend' => 'nullable|numeric|min:0',
            'expires_at' => 'nullable|date',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $voucher->update($request->all());
        return response()->json($voucher);
    }

    public function destroy(Voucher $voucher)
    {
        $voucher->delete();
        return response()->json(['message' => 'Voucher deleted']);
    }

    public function validateVoucher(Request $request)
    {
        $request->validate(['code' => 'required|string']);
        
        $voucher = Voucher::where('code', $request->code)
            ->where('is_active', true)
            ->first();

        if (!$voucher) {
            return response()->json(['message' => 'Invalid or inactive voucher code.'], 404);
        }

        if ($voucher->expires_at && $voucher->expires_at->isPast()) {
            return response()->json(['message' => 'This voucher has expired.'], 400);
        }

        return response()->json($voucher);
    }
}
