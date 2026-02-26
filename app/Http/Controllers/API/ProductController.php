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
        try {
            $query = Product::with(['skus', 'sales' => function($q) {
                $now = now();
                $q->where('is_active', true)
                  ->where('start_date', '<=', $now)
                  ->where('end_date', '>=', $now);
            }]);
            
            if ($request->has('brand') && $request->brand) {
                $query->where('brand', $request->brand);
            }
            if ($request->has('type') && $request->type) {
                $query->where('type', $request->type);
            }
            if ($request->has('performance_tech') && $request->performance_tech) {
                $query->where('performance_tech', $request->performance_tech);
            }
            if ($request->has('gender') && $request->gender) {
                $query->where('gender', $request->gender);
            }
            
            // Handle limit parameter - if provided and high, get all, otherwise paginate
            $limit = $request->input('limit', 20);
            if ($limit >= 1000) {
                // Get all products without pagination
                $products = $query->get();
                $result = [
                    'data' => $products,
                    'total' => $products->count(),
                    'per_page' => $limit,
                    'current_page' => 1
                ];
            } else {
                // Use pagination
                $result = $query->paginate($limit);
            }
            
            // Mark products as trending based on recent orders (last 7 days)
            $items = isset($result['data']) ? $result['data'] : $result->items();
            foreach ($items as $product) {
                try {
                    // Count orders for this product in the last 7 days through SKUs
                    $recentOrderCount = \DB::table('order_items')
                        ->join('orders', 'order_items.order_id', '=', 'orders.id')
                        ->join('skus', 'order_items.sku_id', '=', 'skus.id')
                        ->where('skus.product_id', $product->id)
                        ->where('orders.created_at', '>=', now()->subDays(7))
                        ->count();
                    
                    // Mark as trending if 3+ orders in last 7 days
                    $product->is_trending = $recentOrderCount >= 3;
                    
                    // Add store-wide sales that apply to all products of each seller
                    $now = now();
                    $storeWideSale = \App\Models\Sale::where('seller_id', $product->seller_id)
                        ->whereNull('product_id')
                        ->where('is_active', true)
                        ->where('start_date', '<=', $now)
                        ->where('end_date', '>=', $now)
                        ->first();
                    
                    if ($storeWideSale) {
                        // Add store-wide sale to the product's sales collection
                        $product->sales->push($storeWideSale);
                    }
                } catch (\Exception $e) {
                    // If trending calculation fails, just skip it
                    \Log::warning('Failed to calculate trending for product ' . $product->id . ': ' . $e->getMessage());
                    $product->is_trending = false;
                }
            }
            
            return response()->json($result);
        } catch (\Exception $e) {
            \Log::error('Product index error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'error' => 'Failed to fetch products',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $product = Product::with(['skus', 'sales' => function($q) {
                $now = now();
                $q->where('is_active', true)
                  ->where('start_date', '<=', $now)
                  ->where('end_date', '>=', $now);
            }])->findOrFail($id);
            
            // Increment view count
            $product->increment('view_count');
            
            // Check if trending based on recent orders through SKUs
            try {
                $recentOrderCount = \DB::table('order_items')
                    ->join('orders', 'order_items.order_id', '=', 'orders.id')
                    ->join('skus', 'order_items.sku_id', '=', 'skus.id')
                    ->where('skus.product_id', $product->id)
                    ->where('orders.created_at', '>=', now()->subDays(7))
                    ->count();
                $product->is_trending = $recentOrderCount >= 3;
            } catch (\Exception $e) {
                \Log::warning('Failed to calculate trending for product ' . $product->id . ': ' . $e->getMessage());
                $product->is_trending = false;
            }
            
            // Check for store-wide sale
            $now = now();
            $storeWideSale = \App\Models\Sale::where('seller_id', $product->seller_id)
                ->whereNull('product_id')
                ->where('is_active', true)
                ->where('start_date', '<=', $now)
                ->where('end_date', '>=', $now)
                ->first();
            
            if ($storeWideSale) {
                $product->sales->push($storeWideSale);
            }
            
            return response()->json($product);
        } catch (\Exception $e) {
            \Log::error('Product show error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to fetch product',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $this->authorize('create', Product::class); // For sellers
        
        // Parse SKUs safely
        $skus = [];
        if ($request->has('skus')) {
            $skus = json_decode($request->skus, true) ?? [];
        }
        
        // Validate input
        $validator = Validator::make(array_merge($request->all(), ['skus' => $skus]), [
            'name' => 'required|string|max:255',
            'brand' => 'nullable|string|max:255',
            'type' => 'nullable|string|max:255',
            'material' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'performance_tech' => 'nullable|string|max:255',
            'release_date' => 'nullable|date',
            'gender' => 'nullable|string|max:50',
            'age_group' => 'nullable|string|max:50',
            'skus' => 'required|array|min:1',
            'skus.*.size' => 'required|string|max:50',
            'skus.*.color' => 'required|string|max:100',
            'skus.*.width' => 'nullable|string|max:50',
            'skus.*.stock' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create product
        $data = $request->only(['name', 'brand', 'type', 'material', 'description', 'price', 'performance_tech', 'release_date', 'gender', 'age_group']);
        $data['seller_id'] = auth()->id();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);

        // Create SKUs
        foreach ($skus as $skuData) {
            Sku::create($skuData + ['product_id' => $product->id]);
        }

        return response()->json(['data' => $product->load('skus')], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        
        // Check authorization
        if (!($request->user()->id === $product->seller_id || $request->user()->role === 'admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Parse SKUs from JSON string if needed (before validation)
        $skus = is_string($request->skus) ? json_decode($request->skus, true) : $request->skus;
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string',
            'price' => 'required|numeric',
            'brand' => 'nullable|string',
            'type' => 'nullable|string',
            'material' => 'nullable|string',
            'description' => 'nullable|string',
            'gender' => 'nullable|string',
            'image' => 'nullable|image',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Validate SKUs separately
        if (!is_array($skus) || count($skus) < 1) {
            return response()->json(['errors' => ['skus' => ['At least one SKU is required']]], 422);
        }
        
        foreach ($skus as $index => $sku) {
            if (empty($sku['size']) || empty($sku['color']) || !isset($sku['stock'])) {
                return response()->json(['errors' => ['skus' => ['Each SKU must have size, color, and stock']]], 422);
            }
            if (!is_numeric($sku['stock']) || $sku['stock'] < 0) {
                return response()->json(['errors' => ['skus' => ['Stock must be a positive number']]], 422);
            }
        }

        // Handle image upload if provided
        $data = $request->only(['name', 'price', 'brand', 'type', 'material', 'description', 'gender']);
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image'] = $path;
        }

        // Update product
        $product->update($data);

        // Update SKUs - don't delete ones that are in orders
        // Get existing SKU IDs
        $existingSkuIds = $product->skus->pluck('id')->toArray();
        $newSkuIds = [];
        
        foreach ($skus as $skuData) {
            // Try to find existing SKU with same size and color
            $existingSku = $product->skus()
                ->where('size', $skuData['size'])
                ->where('color', $skuData['color'])
                ->where('width', $skuData['width'] ?? null)
                ->first();
            
            if ($existingSku) {
                // Update existing SKU
                $existingSku->update(['stock' => $skuData['stock']]);
                $newSkuIds[] = $existingSku->id;
            } else {
                // Create new SKU
                $newSku = Sku::create($skuData + ['product_id' => $product->id]);
                $newSkuIds[] = $newSku->id;
            }
        }
        
        // Delete SKUs that are not in the new list and not referenced in orders
        $skusToDelete = array_diff($existingSkuIds, $newSkuIds);
        if (!empty($skusToDelete)) {
            // Only delete SKUs that don't have order items
            $product->skus()
                ->whereIn('id', $skusToDelete)
                ->whereDoesntHave('orderItems')
                ->delete();
        }

        return response()->json(['data' => $product->load('skus')], 200);
    }

    public function updateStock(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        
        // Check authorization
        if (!($request->user()->id === $product->seller_id || $request->user()->role === 'admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'stock' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update all SKUs to have this stock level
        $product->skus()->update(['stock' => $request->stock]);
        
        return response()->json([
            'message' => 'Stock updated successfully',
            'data' => $product->load('skus')
        ], 200);
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