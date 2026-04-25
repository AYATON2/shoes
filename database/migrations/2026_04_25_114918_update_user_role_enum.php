<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateUserRoleEnum extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'seller', 'staff', 'customer', 'rider') NOT NULL DEFAULT 'customer'");
        \Illuminate\Support\Facades\DB::table('users')->where('role', 'seller')->update(['role' => 'staff']);
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'customer', 'rider') NOT NULL DEFAULT 'customer'");
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'staff', 'customer') NOT NULL DEFAULT 'customer'");
    }
}
