<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sku;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('skus');
        if ($request->has('brand')) {
            $query->where('brand', $request->brand);
        }
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('performance_tech')) {
            $query->where('performance_tech', $request->performance_tech);
        }
        $products = $query->paginate(20);
        return response()->json($products);
    }

    public function show($id)
    {
        $product = Product::with('skus')->findOrFail($id);
        return response()->json($product);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Product::class); // For sellers
        $skus = json_decode($request->skus, true);
        $validator = Validator::make(array_merge($request->all(), ['skus' => $skus]), [
            'name' => 'required|string',
            'brand' => 'required|string',
            'type' => 'required|string',
            'material' => 'required|string',
            'description' => 'required|string',
            'price' => 'required|numeric',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'performance_tech' => 'nullable|string',
            'release_date' => 'nullable|date',
            'gender' => 'nullable|string',
            'age_group' => 'nullable|string',
            'skus' => 'required|array',
            'skus.*.size' => 'required|string',
            'skus.*.color' => 'required|string',
            'skus.*.width' => 'required|string',
            'skus.*.stock' => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $data = $request->only(['name', 'brand', 'type', 'material', 'description', 'price', 'performance_tech', 'release_date', 'gender', 'age_group']);
        $data['seller_id'] = auth()->id();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);

        foreach ($skus as $skuData) {
            Sku::create($skuData + ['product_id' => $product->id]);
        }

        return response()->json($product->load('skus'), 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $this->authorize('update', $product);
        // Similar to store
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $this->authorize('delete', $product);
        $product->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function getFilterOptions()
    {
        $brands = Product::distinct()->pluck('brand')->filter()->values();
        $types = Product::distinct()->pluck('type')->filter()->values();
        $performanceTechs = Product::distinct()->pluck('performance_tech')->filter()->values();
        return response()->json([
            'brands' => $brands,
            'types' => $types,
            'performance_tech' => $performanceTechs,
        ]);
    }
}