<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddCancelledToOrdersStatus extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            // For MySQL, we need to modify the enum
            DB::statement("ALTER TABLE orders MODIFY status ENUM('received', 'quality_check', 'shipped', 'delivered', 'cancelled') DEFAULT 'received'");
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            DB::statement("ALTER TABLE orders MODIFY status ENUM('received', 'quality_check', 'shipped', 'delivered') DEFAULT 'received'");
        });
    }
}
