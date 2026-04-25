<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

$orders = Order::with('shippingAddress')->get();
foreach ($orders as $order) {
    echo "Order #{$order->id}:\n";
    echo "  Shipping Address ID: " . ($order->shipping_address_id ?? 'NULL') . "\n";
    echo "  Shipping Address Relation: " . ($order->shippingAddress ? 'FOUND' : 'NOT FOUND') . "\n";
    if ($order->shippingAddress) {
        echo "    Name: " . ($order->shippingAddress->name ?? 'NULL') . "\n";
        echo "    Phone: " . ($order->shippingAddress->phone ?? 'NULL') . "\n";
        echo "    Street: " . ($order->shippingAddress->street ?? 'NULL') . "\n";
    }
    echo "-------------------\n";
}
