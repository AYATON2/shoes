<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== PRODUCTS IN DATABASE ===\n\n";
$products = \App\Models\Product::take(10)->get(['id', 'name', 'seller_id', 'price']);

if ($products->isEmpty()) {
    echo "No products found!\n";
} else {
    foreach($products as $product) {
        echo "ID: {$product->id} | Name: {$product->name} | Price: ₱{$product->price} | Seller: {$product->seller_id}\n";
    }
}

echo "\n=== TESTING PRODUCT API WITH SALES ===\n";
$now = now();
$product = \App\Models\Product::with(['skus', 'sales' => function($q) use ($now) {
    $q->where('is_active', true)
      ->where('start_date', '<=', $now)
      ->where('end_date', '>=', $now);
}])->first();

if ($product) {
    echo "Product: {$product->name} (ID: {$product->id})\n";
    echo "Sales count from relationship: {$product->sales->count()}\n";
    
    // Check for store-wide sale
    $storeWideSale = \App\Models\Sale::where('seller_id', $product->seller_id)
        ->whereNull('product_id')
        ->where('is_active', true)
        ->where('start_date', '<=', $now)
        ->where('end_date', '>=', $now)
        ->first();
    
    if ($storeWideSale) {
        echo "Store-wide sale found: ID {$storeWideSale->id}, {$storeWideSale->discount_percentage}% off\n";
    } else {
        echo "No store-wide sale found\n";
    }
}
