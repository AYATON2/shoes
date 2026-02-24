<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

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
    }
}
