<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/storage/{path}', function ($path) {
    $baseDir = realpath(storage_path('app/public'));
    $filePath = realpath($baseDir . '/' . ltrim($path, '/'));

    if ($filePath === false || !is_file($filePath) || !str_starts_with($filePath, $baseDir . DIRECTORY_SEPARATOR)) {
        abort(404);
    }

    return response()->file($filePath);
})->where('path', '.*');
