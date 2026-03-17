<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Delete old expired sales
echo "Deleting expired sales...\n";
\App\Models\Sale::where('end_date', '<', now())->delete();

// Create a new store-wide sale that applies to ALL products
$sale = \App\Models\Sale::create([
    'seller_id' => 1,
    'title' => 'Weekend Flash Sale',
    'name' => 'Weekend Flash Sale',
    'description' => 'Amazing discounts on all products!',
    'discount_percentage' => 30,
    'discount_amount' => 0,
    'start_date' => now(),
    'end_date' => now()->addDays(7),
    'is_active' => 1,
    'product_id' => null  // NULL means store-wide
]);

echo "✓ Created store-wide sale: {$sale->name}\n";
echo "  Discount: {$sale->discount_percentage}%\n";
echo "  Valid: {$sale->start_date} to {$sale->end_date}\n";
echo "  Applies to: ALL products (store-wide)\n";

// Verify it works
$now = now();
$activeSale = \App\Models\Sale::where('seller_id', 1)
    ->whereNull('product_id')
    ->where('is_active', true)
    ->where('start_date', '<=', $now)
    ->where('end_date', '>=', $now)
    ->first();

if ($activeSale) {
    echo "\n✓ Verified: Store-wide sale is active and will apply to all products!\n";
} else {
    echo "\n✗ Error: Sale not found in query\n";
}
