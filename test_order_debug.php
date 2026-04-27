<?php
// Test order creation flow using tinker
use App\Models\User;
use App\Models\Address;
use App\Models\Order;
use App\Models\Sku;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

echo "=== ORDER PLACEMENT DEBUG TEST ===\n\n";

// Get or create test user
$user = User::where('email', 'test@example.com')->first();
if (!$user) {
    $user = User::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => bcrypt('password'),
        'role' => 'customer',
        'is_active' => true
    ]);
    echo "[✓] Created test user\n";
} else {
    echo "[✓] Using existing test user\n";
}

// Login as user
Auth::login($user);
echo "[✓] Logged in as: {$user->email}\n";

// Create test address
$address = Address::create([
    'user_id' => $user->id,
    'street' => '123 Test Street',
    'city' => 'Manila',
    'state' => 'NCR',
    'zip' => '1234',
    'country' => 'Philippines',
    'is_default' => true
]);
echo "[✓] Created test address (ID: {$address->id})\n";

// Get first available SKU
$sku = Sku::first();
if (!$sku) {
    echo "[✗] No SKUs found in database\n";
    exit(1);
}
echo "[✓] Found SKU (ID: {$sku->id}, Stock: {$sku->stock})\n";

// Create test order
echo "\n=== ORDER CREATION TEST ===\n";
echo "Order data:\n";
echo "  - user_id: {$user->id}\n";
echo "  - total: 1000\n";
echo "  - status: received\n";
echo "  - shipping_address_id: {$address->id}\n";
echo "  - payment_method: cod\n";

try {
    $order = Order::create([
        'user_id' => $user->id,
        'total' => 1000,
        'status' => 'received',
        'shipping_address_id' => $address->id,
        'payment_method' => 'cod',
        'shipping_fee' => 50.00
    ]);
    echo "[✓] Order created successfully (ID: {$order->id})\n";
} catch (\Exception $e) {
    echo "[✗] Order creation failed:\n";
    echo "  Error: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n=== TEST PASSED ===\n";
