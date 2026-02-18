<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAdditionalFieldsToProductsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('performance_tech')->nullable();
            $table->date('release_date')->nullable();
            $table->string('gender')->nullable(); // unisex, men, women, kids
            $table->string('age_group')->nullable(); // adult, youth, etc.
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['performance_tech', 'release_date', 'gender', 'age_group']);
        });
    }
}