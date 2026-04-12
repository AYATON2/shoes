<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\AddressController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\SaleController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'app_env' => env('APP_ENV'),
        'app_debug' => (bool) env('APP_DEBUG', false),
    ]);
});

Route::get('/health/db', function () {
    try {
        DB::select('SELECT 1');
        return response()->json([
            'status' => 'ok',
            'db' => 'connected',
            'database' => env('DB_DATABASE'),
            'host' => env('DB_HOST'),
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status' => 'error',
            'db' => 'failed',
            'message' => $e->getMessage(),
            'database' => env('DB_DATABASE'),
            'host' => env('DB_HOST'),
        ], 500);
    }
});

// Products should be real-time so stock/sale updates are immediately visible.
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{id}', [ProductController::class, 'show'])->whereNumber('id');

// Filter options can stay cached.
Route::middleware(['response.cache:300'])->group(function () {
    Route::get('products/filter-options', [ProductController::class, 'getFilterOptions']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::put('/products/{id}/stock', [ProductController::class, 'updateStock']);
    Route::apiResource('products', ProductController::class)->except(['index', 'show']);
    Route::apiResource('orders', OrderController::class)->except(['destroy']);
    Route::get('/orders/{id}/invoice', [OrderController::class, 'invoice']);
    Route::post('/orders/{id}/verify-payment', [OrderController::class, 'verifyPayment']);
    Route::apiResource('addresses', AddressController::class);
    Route::get('/reports/sales', [ReportController::class, 'salesReport']);
    Route::get('/reports/inventory', [ReportController::class, 'inventoryReport']);
    Route::get('/reports/orders', [ReportController::class, 'orderStatusReport']);
    Route::get('/reports/seller-sales', [ReportController::class, 'sellerSalesReport']);
    Route::apiResource('users', UserController::class)->except(['show']);
    Route::patch('/users/{user}/deactivate', [UserController::class, 'deactivate']);
    Route::patch('/users/{user}/activate', [UserController::class, 'activate']);
    Route::patch('/users/{user}/approve', [UserController::class, 'approve']);
    Route::patch('/users/{user}/suspend', [UserController::class, 'suspend']);
    
    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread', [NotificationController::class, 'unread']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    
    // Sale routes
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/active', [SaleController::class, 'getActiveSales']);
    Route::get('/products/{productId}/sales', [SaleController::class, 'getProductSales']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::put('/sales/{id}', [SaleController::class, 'update']);
    Route::delete('/sales/{id}', [SaleController::class, 'destroy']);
    Route::patch('/sales/{id}/toggle', [SaleController::class, 'toggleActive']);
    
    // Invoice routes
    Route::get('/invoices', 'App\\Http\\Controllers\\API\\InvoiceController@index');
    Route::get('/invoices/{invoice}', 'App\\Http\\Controllers\\API\\InvoiceController@show');
    Route::get('/invoices/{invoice}/download', 'App\\Http\\Controllers\\API\\InvoiceController@download')->name('invoices.download');
    Route::post('/invoices/{invoice}/email', 'App\\Http\\Controllers\\API\\InvoiceController@email');
    Route::post('/invoices/{invoice}/mark-as-paid', 'App\\Http\\Controllers\\API\\InvoiceController@markAsPaid');
    Route::post('/invoices/{invoice}/regenerate', 'App\\Http\\Controllers\\API\\InvoiceController@regenerate');
});
