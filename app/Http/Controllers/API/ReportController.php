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

        $query = Order::selectRaw('DATE(created_at) as date, SUM(total) as revenue, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date', 'desc');

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $reports = $query->get();
        return response()->json($reports);
    }

    public function inventoryReport()
    {
        $this->authorize('viewAdmin', auth()->user());

        $topSizes = Sku::select('size', DB::raw('SUM(stock) as total_stock'))
            ->groupBy('size')
            ->orderBy('total_stock', 'desc')
            ->take(10)
            ->get();

        $topBrands = Product::select('brand', DB::raw('COUNT(*) as count'))
            ->groupBy('brand')
            ->orderBy('count', 'desc')
            ->take(10)
            ->get();

        return response()->json([
            'top_sizes' => $topSizes,
            'top_brands' => $topBrands,
        ]);
    }

    public function orderStatusReport()
    {
        $this->authorize('viewAdmin', auth()->user());

        $statuses = Order::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        return response()->json($statuses);
    }

    public function sellerSalesReport(Request $request)
    {
        $user = auth()->user();
        if ($user->role !== 'seller') {
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
