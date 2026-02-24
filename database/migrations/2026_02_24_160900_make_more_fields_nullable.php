<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class MakeMoreFieldsNullable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Make description and other optional fields nullable
        DB::statement('ALTER TABLE products MODIFY description LONGTEXT NULL');
        DB::statement('ALTER TABLE products MODIFY brand VARCHAR(255) NULL');
        DB::statement('ALTER TABLE products MODIFY type VARCHAR(255) NULL');
        DB::statement('ALTER TABLE products MODIFY image VARCHAR(255) NULL');
        DB::statement('ALTER TABLE products MODIFY performance_tech VARCHAR(255) NULL');
        DB::statement('ALTER TABLE products MODIFY release_date DATE NULL');
        DB::statement('ALTER TABLE products MODIFY gender VARCHAR(50) NULL');
        DB::statement('ALTER TABLE products MODIFY age_group VARCHAR(50) NULL');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Revert to NOT NULL
        DB::statement('ALTER TABLE products MODIFY description LONGTEXT NOT NULL');
        DB::statement('ALTER TABLE products MODIFY brand VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE products MODIFY type VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE products MODIFY image VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE products MODIFY performance_tech VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE products MODIFY release_date DATE NOT NULL');
        DB::statement('ALTER TABLE products MODIFY gender VARCHAR(50) NOT NULL');
        DB::statement('ALTER TABLE products MODIFY age_group VARCHAR(50) NOT NULL');
    }
}
