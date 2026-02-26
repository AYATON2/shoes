<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSalesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('seller_id');
            $table->string('title'); // e.g., "11/11 Flash Sale", "Christmas Discount"
            $table->text('description')->nullable();
            $table->decimal('discount_amount', 10, 2)->nullable(); // Fixed discount (e.g., 100.00)
            $table->decimal('discount_percentage', 5, 2)->nullable(); // Percentage discount (e.g., 20.50 for 20.5%)
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->boolean('is_active')->default(true);
            $table->decimal('sale_price', 10, 2)->nullable(); // Computed price after discount
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('seller_id')->references('id')->on('users')->onDelete('cascade');
            $table->timestamps();
            $table->index(['product_id', 'seller_id']);
            $table->index(['start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('sales');
    }
}
