<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$users = User::whereNull('customer_number')->get();
echo "Found " . $users->count() . " users without customer number.\n";

foreach ($users as $user) {
    $customerNumber = 'STP-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    while (User::where('customer_number', $customerNumber)->exists()) {
        $customerNumber = 'STP-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }
    $user->update(['customer_number' => $customerNumber]);
    echo "Updated user " . $user->name . " with " . $customerNumber . "\n";
}

echo "Done.\n";
