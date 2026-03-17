<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== SALES IN DATABASE ===\n\n";
$sales = \App\Models\Sale::all();

if ($sales->isEmpty()) {
    echo "No sales found in database!\n";
} else {
    foreach($sales as $sale) {
        echo "ID: {$sale->id}\n";
        echo "Name: {$sale->name}\n";
        echo "Discount: " . ($sale->discount_percentage ? "{$sale->discount_percentage}%" : "₱{$sale->discount_amount}") . "\n";
        echo "Start: {$sale->start_date}\n";
        echo "End: {$sale->end_date}\n";
        echo "Active: " . ($sale->is_active ? 'YES' : 'NO') . "\n";
        echo "Seller ID: {$sale->seller_id}\n";
        echo "Product ID: " . ($sale->product_id ?? 'NULL (store-wide)') . "\n";
        echo "---\n";
    }
}

echo "\n=== CHECKING CURRENT TIME ===\n";
echo "Current server time: " . now() . "\n";

echo "\n=== CHECKING ACTIVE SALES (matching query) ===\n";
$now = now();
$activeSales = \App\Models\Sale::where('is_active', true)
    ->where('start_date', '<=', $now)
    ->where('end_date', '>=', $now)
    ->get();

if ($activeSales->isEmpty()) {
    echo "No active sales matching query criteria!\n";
} else {
    foreach($activeSales as $sale) {
        echo "Active sale found: {$sale->name} (ID: {$sale->id})\n";
    }
}
