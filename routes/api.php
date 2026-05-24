<?php

use App\Http\Controllers\Api\ClientErrorController;
use App\Http\Controllers\Api\V1\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', function () {
        return response()->json([
            'success' => true,
            'message' => 'Laravel API is running.',
            'app' => config('app.name'),
            'env' => config('app.env'),
        ]);
    });

    Route::post('/client-errors', [ClientErrorController::class, 'store'])
        ->middleware('throttle:api');

    Route::middleware('throttle:auth')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    Route::middleware(['auth:sanctum', 'throttle:protected'])->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);

        Route::get('/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Welcome to protected dashboard.',
            ]);
        });

        Route::middleware(['role:admin', 'ability:admin'])->get('/admin/dashboard', function () {
            return response()->json([
                'success' => true,
                'message' => 'Welcome admin.',
            ]);
        });
    });

    Route::get('/test-error', function () {
        throw new RuntimeException('Testing Laravel Telegram error log with Render deployment.');
    });
});