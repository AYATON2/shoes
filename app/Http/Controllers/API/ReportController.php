<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sku;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesReport(Request $request)
    {
        $this->authorize('viewAdmin', auth()->user());
        $user = auth()->user();

        $query = Order::query();

        if ($user->role === 'staff') {
            $query->whereHas('orderItems.sku.product', function ($q) use ($user) {
                $q->where('seller_id', $user->id);
            })
            ->join('order_items', 'orders.id', '=', 'order_items.order_id')
            ->join('skus', 'order_items.sku_id', '=', 'skus.id')
            ->join('products', 'skus.product_id', '=', 'products.id')
            ->where('products.seller_id', $user->id)
            ->selectRaw('DATE(orders.created_at) as date, SUM(order_items.quantity * order_items.price) as revenue, COUNT(DISTINCT orders.id) as orders')
            ->groupBy('date');
        } else {
            $query->selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders')
                ->groupBy('date');
        }

        $query->orderBy('date', 'desc');

        if ($request->has('start_date')) {
            $query->whereDate($user->role === 'staff' ? 'orders.created_at' : 'created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate($user->role === 'staff' ? 'orders.created_at' : 'created_at', '<=', $request->end_date);
        }

        $reports = $query->get();
        return response()->json($reports);
    }

    public function inventoryReport()
    {
        $this->authorize('viewAdmin', auth()->user());
        $user = auth()->user();

        // Get products with their total stock across all SKUs
        $query = Product::select('products.id', 'products.name as product_name', DB::raw('SUM(skus.stock) as total_stock'))
            ->join('skus', 'products.id', '=', 'skus.product_id')
            ->groupBy('products.id', 'products.name');

        if ($user->role === 'staff') {
            $query->where('products.seller_id', $user->id);
        }

        $lowStockProducts = $query->orderBy('total_stock', 'asc')->get();

        return response()->json($lowStockProducts);
    }

    public function orderStatusReport()
    {
        $this->authorize('viewAdmin', auth()->user());
        $user = auth()->user();

        $query = Order::query();

        if ($user->role === 'staff') {
            $query->whereHas('orderItems.sku.product', function ($q) use ($user) {
                $q->where('seller_id', $user->id);
            });
        }

        $statuses = $query->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        return response()->json($statuses);
    }

    public function staffSalesReport(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'staff') {
            abort(403);
        }

        $query = Order::whereHas('orderItems.sku.product', function ($q) use ($user) {
            $q->where('seller_id', $user->id);
        })
        ->selectRaw('DATE(orders.created_at) as date, SUM(order_items.quantity * order_items.price) as revenue, SUM(order_items.quantity) as items_sold')
        ->join('order_items', 'orders.id', '=', 'order_items.order_id')
        ->groupBy('date')
        ->orderBy('date', 'desc');

        if ($request->has('start_date')) {
            $query->whereDate('orders.created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('orders.created_at', '<=', $request->end_date);
        }

        $reports = $query->get();
        $totalRevenue = $reports->sum('revenue');
        $totalItems = $reports->sum('items_sold');

        return response()->json([
            'reports' => $reports,
            'total_revenue' => $totalRevenue,
            'total_items_sold' => $totalItems,
        ]);
    }
}
