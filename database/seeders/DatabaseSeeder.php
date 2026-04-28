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
        \App\Models\User::updateOrCreate(
            ['email' => 'admin@stepup.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'active' => true,
                'approved' => true
            ]
        );

        \App\Models\User::updateOrCreate(
            ['email' => 'staff@stepup.com'],
            [
                'name' => 'Staff User',
                'password' => bcrypt('password'),
                'role' => 'staff',
                'active' => true,
                'approved' => true
            ]
        );

        \App\Models\User::updateOrCreate(
            ['email' => 'customer@stepup.com'],
            [
                'name' => 'Customer User',
                'password' => bcrypt('password'),
                'role' => 'customer',
                'active' => true,
                'approved' => true
            ]
        );
    }
}
