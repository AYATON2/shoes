<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductEnrichmentService
{
    /**
     * Number of orders in the trending window required to flag a product as trending.
     */
    public const TRENDING_ORDER_THRESHOLD = 3;

    /**
     * Length in days of the window used to detect trending products.
     */
    public const TRENDING_WINDOW_DAYS = 7;

    /**
     * Eager load SKUs together with the sales that are running right now.
     */
    public static function withActiveSales(): Builder
    {
        return Product::with(['skus', 'sales' => function ($query) {
            $query->currentlyActive();
        }]);
    }

    /**
     * Flag the product as trending and append the seller's store-wide sale, if any.
     *
     * @param  iterable<Product>|Product  $products
     */
    public static function enrich($products): void
    {
        foreach (is_iterable($products) ? $products : [$products] as $product) {
            self::markTrending($product);
            self::appendStoreWideSale($product);
        }
    }

    private static function markTrending(Product $product): void
    {
        try {
            $recentOrderCount = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('skus', 'order_items.sku_id', '=', 'skus.id')
                ->where('skus.product_id', $product->id)
                ->where('orders.created_at', '>=', now()->subDays(self::TRENDING_WINDOW_DAYS))
                ->count();

            $product->is_trending = $recentOrderCount >= self::TRENDING_ORDER_THRESHOLD;
        } catch (\Exception $e) {
            Log::warning('Failed to calculate trending for product ' . $product->id . ': ' . $e->getMessage());
            $product->is_trending = false;
        }
    }

    private static function appendStoreWideSale(Product $product): void
    {
        $storeWideSale = Sale::where('seller_id', $product->seller_id)
            ->storeWide()
            ->currentlyActive()
            ->first();

        if ($storeWideSale) {
            $product->sales->push($storeWideSale);
        }
    }
}
