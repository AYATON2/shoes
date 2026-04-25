<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class BackfillAddressNames extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $addresses = DB::table('addresses')
            ->join('users', 'addresses.user_id', '=', 'users.id')
            ->whereNull('addresses.name')
            ->select('addresses.id', 'users.name as user_name')
            ->get();

        foreach ($addresses as $address) {
            DB::table('addresses')->where('id', $address->id)->update(['name' => $address->user_name]);
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
