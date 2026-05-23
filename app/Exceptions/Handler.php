<?php

namespace App\Exceptions;

use App\Services\TelegramErrorLogger;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $withoutDuplicates = true;

    protected $dontReport = [
        //
    ];

    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->stopIgnoring(HttpException::class);
    }

    public function render($request, Throwable $e)
    {
        $statusCode = $this->getStatusCode($e);

        app(TelegramErrorLogger::class)->sendException($e, $request, $statusCode);

        if ($request->is('api/*') || $request->expectsJson()) {
            $response = [
                'success' => false,
                'code' => $statusCode,
                'message' => $this->getSafeApiMessage($e, $statusCode),
            ];

            if ($e instanceof ValidationException) {
                $response['errors'] = $e->errors();
            }

            return response()->json($response, $statusCode);
        }

        return parent::render($request, $e);
    }

    private function getStatusCode(Throwable $e): int
    {
        if ($e instanceof ValidationException) {
            return 422;
        }

        if ($e instanceof AuthenticationException) {
            return 401;
        }

        if ($e instanceof AuthorizationException) {
            return 403;
        }

        if ($e instanceof HttpExceptionInterface) {
            return $e->getStatusCode();
        }

        return 500;
    }

    private function getSafeApiMessage(Throwable $e, int $statusCode): string
    {
        if ($e instanceof ValidationException) {
            return 'Validation failed.';
        }

        return match ($statusCode) {
            400 => 'Bad request.',
            401 => 'Unauthenticated.',
            403 => 'Forbidden.',
            404 => 'Resource not found.',
            405 => 'Method not allowed.',
            422 => 'Validation failed.',
            429 => 'Too many requests.',
            default => 'Internal server error.',
        };
    }
}