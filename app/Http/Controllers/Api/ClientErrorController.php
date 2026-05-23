<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TelegramErrorLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientErrorController extends Controller
{
    public function store(Request $request, TelegramErrorLogger $telegramErrorLogger): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'url' => ['nullable', 'string', 'max:2000'],
            'source' => ['nullable', 'string', 'max:2000'],
            'line' => ['nullable'],
            'column' => ['nullable'],
            'stack' => ['nullable', 'string', 'max:5000'],
            'extra' => ['nullable', 'array'],
        ]);

        $telegramErrorLogger->sendClientError($data, $request);

        return response()->json([
            'success' => true,
            'message' => 'Client error logged successfully.',
        ]);
    }
}