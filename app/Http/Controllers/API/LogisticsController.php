<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Logistics;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LogisticsController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:sanctum', 'role:admin'])->except(['index']);
    }

    public function index()
    {
        return response()->json(Logistics::where('is_active', true)->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'base_cost' => 'required|numeric',
            'is_local' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator, false);
        }

        $logistic = Logistics::create($request->all());
        return response()->json($logistic, 201);
    }

    public function update(Request $request, $id)
    {
        $logistic = Logistics::findOrFail($id);
        $logistic->update($request->all());
        return response()->json($logistic);
    }

    public function destroy($id)
    {
        $logistic = Logistics::findOrFail($id);
        $logistic->update(['is_active' => false]);
        return response()->json(['message' => 'Logistics provider deactivated']);
    }
}
