<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== SIMULATING /api/products ENDPOINT ===\n\n";

// Simulate the controller logic
$query = \App\Models\Product::with(['skus', 'sales' => function($q) {
    $now = now();
    $q->where('is_active', true)
      ->where('start_date', '<=', $now)
      ->where('end_date', '>=', $now);
}]);

$products = $query->take(5)->get();

foreach ($products as $product) {
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
    
    echo "Product: {$product->name} (ID: {$product->id})\n";
    echo "  Sales count: {$product->sales->count()}\n";
    
    foreach ($product->sales as $sale) {
        echo "    - Sale ID {$sale->id}: {$sale->discount_percentage}% off\n";
        echo "      Product-specific: " . ($sale->product_id ? "Yes (Product {$sale->product_id})" : "No (Store-wide)") . "\n";
    }
    echo "\n";
}

echo "=== RAW JSON OUTPUT (like API would return) ===\n";
$jsonProducts = $products->map(function($p) {
    return [
        'id' => $p->id,
        'name' => $p->name,
        'price' => $p->price,
        'sales' => $p->sales->map(function($s) {
            return [
                'id' => $s->id,
                'discount_percentage' => $s->discount_percentage,
                'discount_amount' => $s->discount_amount,
                'product_id' => $s->product_id
            ];
        })
    ];
});

echo json_encode($jsonProducts, JSON_PRETTY_PRINT);
