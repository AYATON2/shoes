<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        \App\Models\User::create([
            'name' => 'Admin User',
            'email' => 'admin@stepup.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);

        \App\Models\User::create([
            'name' => 'Seller User',
            'email' => 'seller@stepup.com',
            'password' => bcrypt('password'),
            'role' => 'seller',
        ]);

        \App\Models\User::create([
            'name' => 'Customer User',
            'email' => 'customer@stepup.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
        ]);

        $product = \App\Models\Product::create([
            'name' => 'Nike Air Max',
            'brand' => 'Nike',
            'type' => 'Running',
            'material' => 'Mesh',
            'description' => 'Comfortable running shoes',
            'price' => 120.00,
            'seller_id' => 2,
        ]);

        \App\Models\Sku::create([
            'product_id' => $product->id,
            'size' => '10',
            'colorway' => 'Black',
            'width' => 'Medium',
            'stock' => 10,
        ]);
    }
}
