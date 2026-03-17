<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Find a seller
$user = App\Models\User::where('role', 'seller')->first();

if (!$user) {
    echo "No seller found in database\n";
    exit;
}

// Create a store-wide sale
$sale = App\Models\Sale::create([
    'seller_id' => $user->id,
    'product_id' => null, // Store-wide sale
    'title' => 'Spring Sale 2026',
    'description' => 'Huge spring discount on all products!',
    'discount_percentage' => 30,
    'start_date' => now(),
    'end_date' => now()->addDays(7),
    'is_active' => true
]);

echo "✓ Created sale: {$sale->title} ({$sale->discount_percentage}% off)\n";
echo "  Seller: {$user->name} (ID: {$user->id})\n";
echo "  Valid: " . $sale->start_date->format('Y-m-d') . " to " . $sale->end_date->format('Y-m-d') . "\n";
echo "  This sale will apply to all products from this seller!\n";
