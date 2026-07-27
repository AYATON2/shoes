<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sku;
use App\Services\ProductEnrichmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = ProductEnrichmentService::withActiveSales();

            if ($request->has('include_archived') && $request->include_archived == 'true') {
                // Keep all
            } else if ($request->has('only_archived') && $request->only_archived == 'true') {
                $query->where('is_archived', true);
            } else {
                $query->where('is_archived', false);
            }
            
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
            
            // Handle special filters from Homepage
            if ($request->has('special_filter')) {
                if ($request->special_filter == 'new') {
                    $query->orderBy('created_at', 'desc');
                } else if ($request->special_filter == 'sale') {
                    $query->whereHas('sales', function($q) {
                        $q->currentlyActive();
                    });
                } else if ($request->special_filter == 'bestseller') {
                    // Use view_count as a proxy for bestsellers
                    $query->orderBy('view_count', 'desc');
                }
            } else {
                // Default sorting
                $query->orderBy('created_at', 'desc');
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
            
            ProductEnrichmentService::enrich(isset($result['data']) ? $result['data'] : $result->items());
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Product index error: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return $this->failureResponse('Failed to fetch products', $e->getMessage());
        }
    }

    public function show($id)
    {
        try {
            $product = ProductEnrichmentService::withActiveSales()->findOrFail($id);
            
            // Increment view count
            $product->increment('view_count');
            
            ProductEnrichmentService::enrich($product);
            
            return response()->json($product);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return $this->failureResponse('Product not found', 'The requested product does not exist.', 404);
        } catch (\Exception $e) {
            Log::error('Product show error: ' . $e->getMessage());
            return $this->failureResponse('Failed to fetch product', $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        
        // Allow admin and staff to create products; for others use policy
        if (!in_array($user->role, ['admin', 'staff'])) {
            $this->authorize('create', Product::class);
        }
        
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
            return $this->validationErrorResponse($validator);
        }

        // Create product
        $data = $request->only(['name', 'brand', 'type', 'material', 'description', 'price', 'performance_tech', 'release_date', 'gender', 'age_group']);
        $data['seller_id'] = $user->id;

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
        
        if (!$this->canManageProduct($request, $product)) {
            return $this->unauthorizedResponse();
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
            return $this->validationErrorResponse($validator);
        }
        
        // Validate SKUs separately
        if (!is_array($skus) || count($skus) < 1) {
            return $this->errorsResponse(['skus' => ['At least one SKU is required']]);
        }
        
        foreach ($skus as $index => $sku) {
            if (empty($sku['size']) || empty($sku['color']) || !isset($sku['stock'])) {
                return $this->errorsResponse(['skus' => ['Each SKU must have size, color, and stock']]);
            }
            if (!is_numeric($sku['stock']) || $sku['stock'] < 0) {
                return $this->errorsResponse(['skus' => ['Stock must be a positive number']]);
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
        
        if (!$this->canManageProduct($request, $product)) {
            return $this->unauthorizedResponse();
        }
        
        $validator = Validator::make($request->all(), [
            'stock' => 'required|integer|min:0'
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        // Update all SKUs to have this stock level
        $product->skus()->update(['stock' => $request->stock]);
        
        return response()->json([
            'message' => 'Stock updated successfully',
            'data' => $product->load('skus')
        ], 200);
    }

    private function canManageProduct(Request $request, Product $product): bool
    {
        return $request->user()->id === $product->seller_id || $request->user()->role === 'admin';
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

    public function archive($id)
    {
        $product = Product::findOrFail($id);
        $product->update(['is_archived' => true]);
        return response()->json(['message' => 'Product archived successfully']);
    }

    public function unarchive($id)
    {
        $product = Product::findOrFail($id);
        $product->update(['is_archived' => false]);
        return response()->json(['message' => 'Product unarchived successfully']);
    }
}