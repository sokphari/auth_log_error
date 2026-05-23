<?php

use App\Http\Controllers\Api\ClientErrorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/client-errors', [ClientErrorController::class, 'store']);

Route::get('/test-telegram-error', function () {
    throw new RuntimeException('Testing Telegram error log from Laravel API');
});
Route::get('/test-telegram-error', function () {
    throw new RuntimeException('Testing Telegram 500 server error');
});

Route::get('/test-telegram-404', function () {
    abort(404, 'Testing Telegram 404 not found');
});

Route::get('/test-telegram-403', function () {
    abort(403, 'Testing Telegram 403 forbidden');
});

Route::post('/test-telegram-validation', function (\Illuminate\Http\Request $request) {
    $request->validate([
        'name' => ['required', 'string'],
        'email' => ['required', 'email'],
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Validation passed',
    ]);
});
