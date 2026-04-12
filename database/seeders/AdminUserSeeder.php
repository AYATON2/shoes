<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        if (User::where('email', 'admin@stepup.com')->exists()) {
            return;
        }

        User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@stepup.com',
            'password' => Hash::make('password'),
            'role'     => 'admin',
            'active'   => true,
            'approved' => true,
        ]);
    }
}
