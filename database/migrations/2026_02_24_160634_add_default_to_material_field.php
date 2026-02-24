<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddDefaultToMaterialField extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Use raw SQL to make material nullable with default value
        DB::statement('ALTER TABLE products MODIFY material VARCHAR(255) NULL DEFAULT NULL');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert to not nullable
        DB::statement('ALTER TABLE products MODIFY material VARCHAR(255) NOT NULL');
    }
}
