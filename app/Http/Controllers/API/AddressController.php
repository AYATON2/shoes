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
            'name' => 'required|string',
            'phone' => 'required|string',
            'street' => 'required|string',
            'city' => 'required|string',
            'state' => 'required|string',
            'zip' => 'nullable|string',
            'country' => 'required|string',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator, false);
        }

        $address = Address::create([
            'user_id' => auth()->id(),
            'name' => $request->name,
            'phone' => $request->phone,
            'street' => $request->street,
            'city' => $request->city,
            'state' => $request->state,
            'zip' => $request->zip ?? '',
            'country' => $request->country,
            'is_default' => $request->is_default ?? false,
        ]);

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
            'name' => 'string',
            'phone' => 'string',
            'street' => 'string',
            'city' => 'string',
            'state' => 'string',
            'zip' => 'nullable|string',
            'country' => 'string',
            'is_default' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator, false);
        }

        $data = $request->all();
        if (array_key_exists('zip', $data) && is_null($data['zip'])) {
            $data['zip'] = '';
        }

        $address->update($data);

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