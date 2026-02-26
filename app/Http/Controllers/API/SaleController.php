<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SaleController extends Controller
{
    // Get all sales (with filters)
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = Sale::with('product', 'seller');

        // Sellers only see their own sales
        if ($user->role === 'seller') {
            $query->where('seller_id', $user->id);
        }

        // Filter by status
        if ($request->has('active')) {
            $now = now();
            if ($request->active === 'true') {
                $query->where('is_active', true)
                    ->where('start_date', '<=', $now)
                    ->where('end_date', '>=', $now);
            } else {
                $query->where(function ($q) use ($now) {
                    $q->where('is_active', false)
                      ->orWhere('end_date', '<', $now);
                });
            }
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($sales);
    }

    // Get sales for a specific product
    public function getProductSales($productId)
    {
        $sales = Sale::where('product_id', $productId)
            ->with('seller')
            ->get();

        return response()->json($sales);
    }

    // Get active sales across the platform
    public function getActiveSales(Request $request)
    {
        $now = now();
        $sales = Sale::where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->with('product', 'seller')
            ->orderBy('start_date', 'desc')
            ->paginate(20);

        return response()->json($sales);
    }

    // Create a new sale
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'nullable|exists:products,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = auth()->user();

        // For product-specific sales, check product ownership
        if ($request->product_id) {
            $product = Product::findOrFail($request->product_id);

            // Check authorization - seller can only create sales for their products
            if ($user->role === 'seller' && $product->seller_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Calculate sale price for product-specific sale
            $originalPrice = $product->price;
            $salePrice = $originalPrice;

            if ($request->discount_percentage) {
                $salePrice = $originalPrice - ($originalPrice * ($request->discount_percentage / 100));
            } elseif ($request->discount_amount) {
                $salePrice = $originalPrice - $request->discount_amount;
            }
        } else {
            // Store-wide sale - no specific product
            $salePrice = null;
        }

        // Validate that at least one discount type is provided
        if (!$request->discount_amount && !$request->discount_percentage) {
            return response()->json([
                'message' => 'Either discount_amount or discount_percentage must be provided'
            ], 422);
        }

        $sale = Sale::create([
            'product_id' => $request->product_id,
            'seller_id' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'discount_amount' => $request->discount_amount,
            'discount_percentage' => $request->discount_percentage,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => true,
            'sale_price' => $salePrice !== null ? max(0, $salePrice) : null // Ensure price doesn't go below 0
        ]);

        if ($this->shouldNotifySaleActivation($sale)) {
            $this->createSaleNotifications($sale);
        }

        return response()->json($sale->load('product', 'seller'), 201);
    }

    // Update a sale
    public function update(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);
        $user = auth()->user();
        $wasActive = (bool) $sale->is_active;
        $originalStartDate = $sale->start_date;

        // Check authorization
        if ($user->role === 'seller' && $sale->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'start_date' => 'sometimes|date|after_or_equal:today',
            'end_date' => 'sometimes|date|after:start_date',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $sale->update($request->only([
            'title',
            'description',
            'discount_amount',
            'discount_percentage',
            'start_date',
            'end_date',
            'is_active'
        ]));

        // Recalculate sale price (only for product-specific sales)
        if ($sale->product_id && ($request->has('discount_amount') || $request->has('discount_percentage'))) {
            $product = $sale->product;
            $originalPrice = $product->price;
            $salePrice = $originalPrice;

            if ($sale->discount_percentage) {
                $salePrice = $originalPrice - ($originalPrice * ($sale->discount_percentage / 100));
            } elseif ($sale->discount_amount) {
                $salePrice = $originalPrice - $sale->discount_amount;
            }

            $sale->update(['sale_price' => max(0, $salePrice)]);
        }

        $sale->refresh();
        $startDateMovedToActive = $originalStartDate > now() && $sale->start_date <= now();
        if ((!$wasActive && $sale->is_active) || $startDateMovedToActive) {
            if ($this->shouldNotifySaleActivation($sale)) {
                $this->createSaleNotifications($sale);
            }
        }

        return response()->json($sale->load('product', 'seller'));
    }

    // Delete a sale
    public function destroy($id)
    {
        $sale = Sale::findOrFail($id);
        $user = auth()->user();

        // Check authorization
        if ($user->role === 'seller' && $sale->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $sale->delete();
        return response()->json(['message' => 'Sale deleted successfully']);
    }

    // Toggle sale active status
    public function toggleActive($id)
    {
        $sale = Sale::findOrFail($id);
        $user = auth()->user();

        if ($user->role === 'seller' && $sale->seller_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $sale->update(['is_active' => !$sale->is_active]);
        $sale->refresh();

        if ($this->shouldNotifySaleActivation($sale)) {
            $this->createSaleNotifications($sale);
        }

        return response()->json($sale);
    }

    private function shouldNotifySaleActivation(Sale $sale)
    {
        $now = now();
        return $sale->is_active && $sale->start_date <= $now && $sale->end_date >= $now;
    }

    private function createSaleNotifications(Sale $sale)
    {
        $sale->loadMissing('product', 'seller');
        $discountText = '';
        $discountAmount = $sale->discount_amount ? (float)$sale->discount_amount : 0.0;
        $discountPercentage = $sale->discount_percentage ? (float)$sale->discount_percentage : 0.0;

        if ($discountPercentage > 0) {
            $discountText = "{$discountPercentage}% off";
        } elseif ($discountAmount > 0) {
            $discountText = 'Save ₱' . number_format((float)$discountAmount, 2);
        }

        $title = 'New Sale';
        if ($sale->product_id) {
            // Product-specific sale
            $productName = $sale->product->name ?? 'a product';
            $message = "{$productName} is now on sale ({$discountText}).";
        } else {
            // Store-wide sale
            $sellerName = $sale->seller->name ?? 'A seller';
            $message = "{$sellerName} has a store-wide sale! {$discountText} on all products.";
        }
        $now = now();

        User::where('role', 'customer')
            ->select('id')
            ->chunkById(500, function ($users) use ($title, $message, $now) {
                $rows = [];
                foreach ($users as $user) {
                    $rows[] = [
                        'user_id' => $user->id,
                        'order_id' => null,
                        'title' => $title,
                        'message' => $message,
                        'type' => 'sale',
                        'read' => false,
                        'read_at' => null,
                        'created_at' => $now,
                        'updated_at' => $now
                    ];
                }

                if (!empty($rows)) {
                    Notification::insert($rows);
                }
            });
    }
}
