<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$users = User::all();
foreach ($users as $user) {
    echo "User #{$user->id}: {$user->name}\n";
    echo "  Email: {$user->email}\n";
    echo "  Customer Number: " . ($user->customer_number ?? 'NULL') . "\n";
    echo "  Role: {$user->role}\n";
    echo "-------------------\n";
}
