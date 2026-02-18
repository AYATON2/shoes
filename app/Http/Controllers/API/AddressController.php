<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = auth()->user()->addresses;
        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'street' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'zip' => 'required|string',
            'country' => 'required|string',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $address = Address::create($request->all() + ['user_id' => auth()->id()]);

        if ($request->is_default) {
            Address::where('user_id', auth()->id())->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        return response()->json($address, 201);
    }

    public function show($id)
    {
        $address = Address::findOrFail($id);
        $this->authorize('view', $address);
        return response()->json($address);
    }

    public function update(Request $request, $id)
    {
        $address = Address::findOrFail($id);
        $this->authorize('update', $address);

        $validator = Validator::make($request->all(), [
            'street' => 'string',
            'city' => 'string',
            'state' => 'string',
            'zip' => 'string',
            'country' => 'string',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $address->update($request->all());

        if ($request->is_default) {
            Address::where('user_id', auth()->id())->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        return response()->json($address);
    }

    public function destroy($id)
    {
        $address = Address::findOrFail($id);
        $this->authorize('delete', $address);
        $address->delete();
        return response()->json(['message' => 'Deleted']);
    }
}