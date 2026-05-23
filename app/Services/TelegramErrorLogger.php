<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class TelegramErrorLogger
{
    public function sendException(Throwable $exception, Request $request, int $statusCode = 500): void
    {
        try {
            if (! $this->isEnabled()) {
                return;
            }

            if (! $this->shouldSendForRequest($request)) {
                return;
            }

            $signature = sha1(
                get_class($exception) . '|' .
                $exception->getMessage() . '|' .
                $request->method() . '|' .
                $request->path() . '|' .
                $exception->getFile() . '|' .
                $exception->getLine()
            );

            if (! $this->allowByThrottle($signature)) {
                return;
            }

            $message = $this->buildProfessionalExceptionMessage($exception, $request, $statusCode);

            $this->sendMessage($message);
        } catch (Throwable $telegramException) {
            Log::error('Telegram error logger failed.', [
                'message' => $telegramException->getMessage(),
            ]);
        }
    }

    public function sendClientError(array $data, Request $request): void
    {
        try {
            if (! $this->isEnabled()) {
                return;
            }

            $signature = sha1(
                'client|' .
                ($data['message'] ?? '') . '|' .
                ($data['url'] ?? '') . '|' .
                ($data['line'] ?? '') . '|' .
                ($data['column'] ?? '')
            );

            if (! $this->allowByThrottle($signature)) {
                return;
            }

            $message = $this->buildProfessionalClientMessage($data, $request);

            $this->sendMessage($message);
        } catch (Throwable $telegramException) {
            Log::error('Telegram client error logger failed.', [
                'message' => $telegramException->getMessage(),
            ]);
        }
    }

    private function isEnabled(): bool
    {
        return (bool) config('services.telegram_log.enabled', false);
    }

    private function shouldSendForRequest(Request $request): bool
    {
        if (! config('services.telegram_log.only_api', true)) {
            return true;
        }

        return $request->is('api/*') || $request->expectsJson();
    }

    private function allowByThrottle(string $signature): bool
    {
        $seconds = (int) config('services.telegram_log.throttle_seconds', 30);

        return Cache::add(
            'telegram_error_log:' . $signature,
            true,
            now()->addSeconds($seconds)
        );
    }

    private function sendMessage(string $message): void
    {
        $token = config('services.telegram_log.bot_token');
        $chatId = config('services.telegram_log.chat_id');

        if (! $token || ! $chatId) {
            Log::warning('Telegram log token or chat ID is missing.');
            return;
        }

        Http::timeout(8)
            ->asForm()
            ->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => Str::limit($message, 3900, "\n\n...message trimmed"),
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);
    }

    private function buildProfessionalExceptionMessage(Throwable $exception, Request $request, int $statusCode): string
    {
        $user = $request->user();
        $requestId = (string) Str::uuid();

        $file = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $exception->getFile());

        $payload = $this->safeJson(
            $this->maskSensitiveData($request->all())
        );

        $shortTrace = $this->shortTrace($exception);

        return
            "🚨 <b>Laravel API Error Alert</b>\n" .
            "━━━━━━━━━━━━━━━━━━━━\n\n" .

            "🧩 <b>Application</b>\n" .
            "• App: <code>" . $this->e(config('app.name')) . "</code>\n" .
            "• Environment: <code>" . $this->e(config('app.env')) . "</code>\n" .
            "• Time: <code>" . $this->e(now()->format('Y-m-d H:i:s')) . "</code>\n" .
            "• Request ID: <code>" . $this->e($requestId) . "</code>\n\n" .

            "🔥 <b>Error Summary</b>\n" .
            "• Status Code: <code>" . $this->e($statusCode) . "</code>\n" .
            "• Exception: <code>" . $this->e(class_basename($exception)) . "</code>\n" .
            "• Message: <code>" . $this->e(Str::limit($exception->getMessage() ?: 'No message', 500)) . "</code>\n\n" .

            "🌐 <b>Request Info</b>\n" .
            "• Method: <code>" . $this->e($request->method()) . "</code>\n" .
            "• URL: <code>" . $this->e($request->fullUrl()) . "</code>\n" .
            "• Route: <code>" . $this->e(optional($request->route())->getName() ?? $request->path()) . "</code>\n" .
            "• IP: <code>" . $this->e($request->ip() ?? '-') . "</code>\n\n" .

            "👤 <b>User Info</b>\n" .
            "• User ID: <code>" . $this->e($user?->id ?? 'Guest') . "</code>\n" .
            "• User Agent: <code>" . $this->e(Str::limit($request->userAgent() ?? '-', 250)) . "</code>\n\n" .

            "📍 <b>Location</b>\n" .
            "<code>" . $this->e($file . ':' . $exception->getLine()) . "</code>\n\n" .

            "📦 <b>Request Payload</b>\n" .
            "<pre>" . $this->e($payload) . "</pre>\n\n" .

            "🧵 <b>Short Trace</b>\n" .
            "<pre>" . $this->e($shortTrace) . "</pre>";
    }

    private function buildProfessionalClientMessage(array $data, Request $request): string
    {
        $payload = $this->safeJson(
            $this->maskSensitiveData($data)
        );

        return
            "⚠️ <b>Frontend Client Error Alert</b>\n" .
            "━━━━━━━━━━━━━━━━━━━━\n\n" .

            "🧩 <b>Application</b>\n" .
            "• App: <code>" . $this->e(config('app.name')) . "</code>\n" .
            "• Environment: <code>" . $this->e(config('app.env')) . "</code>\n" .
            "• Time: <code>" . $this->e(now()->format('Y-m-d H:i:s')) . "</code>\n\n" .

            "🔥 <b>Error Summary</b>\n" .
            "• Message: <code>" . $this->e(Str::limit($data['message'] ?? 'Client error', 500)) . "</code>\n" .
            "• Source: <code>" . $this->e($data['source'] ?? '-') . "</code>\n" .
            "• Line: <code>" . $this->e($data['line'] ?? '-') . "</code>\n" .
            "• Column: <code>" . $this->e($data['column'] ?? '-') . "</code>\n\n" .

            "🌐 <b>Client Info</b>\n" .
            "• Client URL: <code>" . $this->e($data['url'] ?? '-') . "</code>\n" .
            "• API URL: <code>" . $this->e($request->fullUrl()) . "</code>\n" .
            "• IP: <code>" . $this->e($request->ip() ?? '-') . "</code>\n" .
            "• User Agent: <code>" . $this->e(Str::limit($request->userAgent() ?? '-', 250)) . "</code>\n\n" .

            "📦 <b>Payload</b>\n" .
            "<pre>" . $this->e($payload) . "</pre>";
    }

    private function shortTrace(Throwable $exception): string
    {
        $trace = collect($exception->getTrace())
            ->take(5)
            ->map(function ($item, $index) {
                $file = $item['file'] ?? 'unknown file';
                $line = $item['line'] ?? '-';

                $file = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file);

                return '#' . $index . ' ' . $file . ':' . $line;
            })
            ->implode("\n");

        return $trace ?: 'No trace available';
    }

    private function maskSensitiveData(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'current_password',
            'token',
            'access_token',
            'refresh_token',
            'authorization',
            'api_key',
            'secret',
            'client_secret',
        ];

        foreach ($data as $key => $value) {
            if (in_array(strtolower((string) $key), $sensitiveKeys, true)) {
                $data[$key] = '******';
                continue;
            }

            if (is_array($value)) {
                $data[$key] = $this->maskSensitiveData($value);
            }
        }

        return $data;
    }

    private function safeJson(array $data): string
    {
        return Str::limit(
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}',
            1000,
            "\n..."
        );
    }

    private function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}