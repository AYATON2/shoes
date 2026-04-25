<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class FixExistingOrdersIsLocalStatus extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $orders = DB::table('orders')
            ->join('addresses', 'orders.shipping_address_id', '=', 'addresses.id')
            ->where(function($q) {
                $q->where('addresses.city', 'like', '%butuan%')
                  ->orWhere('addresses.city', 'like', '%agusan%');
            })
            ->select('orders.id')
            ->get();

        foreach ($orders as $order) {
            DB::table('orders')->where('id', $order->id)->update(['is_local' => true]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // No reverse needed for data fix
    }
}
