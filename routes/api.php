<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\ProductController;
use App\Http\Controllers\API\OrderController;
use App\Http\Controllers\API\AddressController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\SaleController;
use App\Http\Controllers\API\LogisticsController;
use App\Http\Controllers\API\RiderController;
use App\Http\Controllers\API\ReviewController;
use App\Http\Controllers\API\ReturnController;
use App\Http\Controllers\API\VoucherController;

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

// Products should be real-time so stock/sale updates are immediately visible.
Route::get('products', [ProductController::class, 'index']);

// Filter options can stay cached.
Route::middleware(['response.cache:300'])->group(function () {
    Route::get('products/filter-options', [ProductController::class, 'getFilterOptions']);
});

Route::get('products/{id}', [ProductController::class, 'show']);
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::put('/products/{id}/stock', [ProductController::class, 'updateStock']);
    Route::patch('/products/{id}/archive', [ProductController::class, 'archive']);
    Route::patch('/products/{id}/unarchive', [ProductController::class, 'unarchive']);
    Route::apiResource('products', ProductController::class)->except(['index', 'show']);
    Route::apiResource('orders', OrderController::class)->except(['destroy']);
    Route::patch('/orders/{id}/archive', [OrderController::class, 'archive']);
    Route::get('/orders/{id}/invoice', [OrderController::class, 'invoice']);
    Route::post('/orders/{id}/verify-payment', [OrderController::class, 'verifyPayment']);
    Route::apiResource('addresses', AddressController::class);
    Route::get('/reports/sales', [ReportController::class, 'salesReport']);
    Route::get('/reports/inventory', [ReportController::class, 'inventoryReport']);
    Route::get('/reports/orders', [ReportController::class, 'orderStatusReport']);
    Route::get('/reports/staff-sales', [ReportController::class, 'staffSalesReport']);
    Route::apiResource('users', UserController::class)->except(['show']);
    Route::apiResource('vouchers', VoucherController::class);
    Route::post('/vouchers/validate', [VoucherController::class, 'validateVoucher']);
    Route::patch('/users/{user}/deactivate', [UserController::class, 'deactivate']);
    Route::patch('/users/{user}/activate', [UserController::class, 'activate']);
    Route::patch('/users/{user}/approve', [UserController::class, 'approve']);
    Route::patch('/users/{user}/suspend', [UserController::class, 'suspend']);
    
    // Sale routes
    Route::get('/sales', [SaleController::class, 'index']);
    Route::get('/sales/active', [SaleController::class, 'getActiveSales']);
    Route::get('/products/{productId}/sales', [SaleController::class, 'getProductSales']);
    Route::post('/sales', [SaleController::class, 'store']);
    Route::put('/sales/{id}', [SaleController::class, 'update']);
    Route::delete('/sales/{id}', [SaleController::class, 'destroy']);
    Route::patch('/sales/{id}/toggle', [SaleController::class, 'toggleActive']);

    // Logistics routes
    Route::apiResource('logistics', LogisticsController::class);
    
    // Rider routes
    Route::get('/riders', [RiderController::class, 'index']);
    Route::post('/riders', [RiderController::class, 'store']);
    Route::get('/rider/orders', [RiderController::class, 'myOrders']);
    Route::post('/rider/orders/{id}/accept', [RiderController::class, 'acceptOrder']);
    
    // Review routes
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/admin/reviews', [ReviewController::class, 'adminIndex']);
    Route::patch('/reviews/{id}/archive', [ReviewController::class, 'archive']);
    
    // Return routes
    Route::get('/returns', [ReturnController::class, 'index']);
    Route::post('/returns', [ReturnController::class, 'store']);
    Route::patch('/returns/{id}/status', [ReturnController::class, 'updateStatus']);

    // Notification routes
    Route::get('/notifications', [UserController::class, 'notifications']);
    Route::patch('/notifications/read', [UserController::class, 'markNotificationsRead']);
});
