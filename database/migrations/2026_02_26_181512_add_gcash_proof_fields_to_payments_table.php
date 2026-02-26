<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddGcashProofFieldsToPaymentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'payment_screenshot')) {
                $table->string('payment_screenshot')->nullable()->after('status');
            }
            if (!Schema::hasColumn('payments', 'gcash_reference')) {
                $table->string('gcash_reference')->nullable()->after('status');
            }
            if (!Schema::hasColumn('payments', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('payments', 'verified_by')) {
                $table->unsignedBigInteger('verified_by')->nullable()->after('status');
                $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'verified_by')) {
                $table->dropForeign(['verified_by']);
            }
            $columnsToDelete = [];
            if (Schema::hasColumn('payments', 'payment_screenshot')) {
                $columnsToDelete[] = 'payment_screenshot';
            }
            if (Schema::hasColumn('payments', 'gcash_reference')) {
                $columnsToDelete[] = 'gcash_reference';
            }
            if (Schema::hasColumn('payments', 'verified_at')) {
                $columnsToDelete[] = 'verified_at';
            }
            if (Schema::hasColumn('payments', 'verified_by')) {
                $columnsToDelete[] = 'verified_by';
            }
            if (!empty($columnsToDelete)) {
                $table->dropColumn($columnsToDelete);
            }
        });
    }
}
