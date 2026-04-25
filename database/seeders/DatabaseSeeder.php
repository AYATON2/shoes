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
            'name' => 'Staff User',
            'email' => 'staff@stepup.com',
            'password' => bcrypt('password'),
            'role' => 'staff',
        ]);

        \App\Models\User::create([
            'name' => 'Customer User',
            'email' => 'customer@stepup.com',
            'password' => bcrypt('password'),
            'role' => 'customer',
        ]);
    }
}
