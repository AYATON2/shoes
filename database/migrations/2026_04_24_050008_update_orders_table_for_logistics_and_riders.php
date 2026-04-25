<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class UpdateOrdersTableForLogisticsAndRiders extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('logistics_id')->nullable()->after('payment_method');
            $table->unsignedBigInteger('rider_id')->nullable()->after('logistics_id');
            $table->boolean('is_archived')->default(false)->after('status');
            
            $table->foreign('logistics_id')->references('id')->on('logistics');
            $table->foreign('rider_id')->references('id')->on('users');
        });

        // Update status enum values (Laravel way for PostgreSQL/MySQL can be tricky, 
        // using raw SQL to change quality_check to ready_for_pickup or add it)
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('received', 'quality_check', 'ready_for_pickup', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'received'");
        DB::table('orders')->where('status', 'quality_check')->update(['status' => 'ready_for_pickup']);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['logistics_id']);
            $table->dropForeign(['rider_id']);
            $table->dropColumn(['logistics_id', 'rider_id', 'is_archived']);
        });
        
        DB::table('orders')->where('status', 'ready_for_pickup')->update(['status' => 'quality_check']);
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('received', 'quality_check', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'received'");
    }
}
