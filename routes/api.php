<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
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

// Public routes with caching for better performance
Route::middleware(['response.cache:300'])->group(function () {
    Route::get('products', [ProductController::class, 'index']);
    Route::get('products/filter-options', [ProductController::class, 'getFilterOptions']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::apiResource('products', ProductController::class)->except(['index']);
    Route::apiResource('orders', OrderController::class)->except(['destroy']);
    Route::get('/orders/{id}/invoice', [OrderController::class, 'invoice']);
    Route::apiResource('addresses', AddressController::class);
    Route::get('/reports/sales', [ReportController::class, 'salesReport']);
    Route::get('/reports/inventory', [ReportController::class, 'inventoryReport']);
    Route::get('/reports/orders', [ReportController::class, 'orderStatusReport']);
    Route::get('/reports/seller-sales', [ReportController::class, 'sellerSalesReport']);
    Route::apiResource('users', UserController::class)->except(['store', 'show']);
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
});
