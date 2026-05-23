Laravel 10 Telegram Error Logging
Teacher Guide + Student Practice Document
Build a professional API error alert system using Laravel Handler, Telegram Bot API, and client error endpoint.
Warning: Never share a real Telegram bot token in class, screenshots, GitHub, or chat. If a token is exposed, revoke it in BotFather and create a new one.

Class Overview
Item	Details
Target students	Laravel beginner to intermediate students who already understand routes, controllers, and .env configuration.
Class duration	2 to 3 hours, or split into two lessons.
Main goal	Students will catch Laravel API exceptions and frontend/client errors, then send professional alerts to Telegram.
Laravel version	Laravel 10
Output	Safe JSON response for API users, detailed error report for developers in Telegram.
1. Learning Objectives
•	Explain why production APIs should not show real exception details to users.
•	Configure Telegram bot token and chat ID using Laravel .env.
•	Create a reusable TelegramErrorLogger service.
•	Update app/Exceptions/Handler.php to catch API errors globally.
•	Create an API endpoint to receive frontend/client errors.
•	Test 500, 404, 403, 422 validation errors and frontend errors.
•	Apply basic security rules: mask password, token, secret, and authorization fields.
2. Prerequisites
•	Laravel 10 project running with php artisan serve.
•	Telegram account and a bot created from BotFather.
•	Basic knowledge of .env, routes/api.php, controllers, services, and exceptions.
•	Postman or browser for testing API routes.
•	PowerShell terminal on Windows.
3. Concept Explanation for Students
In a production API, the client should receive a safe and simple JSON response. Developers, however, need the real technical details to fix the bug. This lesson separates those two responsibilities:
•	Client response: simple JSON such as {success:false, code:500, message:"Internal server error."}.
•	Developer alert: full error details sent privately to Telegram.
•	Laravel Handler: the global place where exceptions are converted into HTTP responses.
•	TelegramErrorLogger service: a clean reusable class responsible only for formatting and sending Telegram messages.
Best Practice: Teach students that error logging is not only about code. It is also about security, privacy, debugging speed, and user experience.

4. Simple Architecture
Flow for backend/API errors:
1.	API route or controller throws an exception.
2.	Laravel sends the exception to app/Exceptions/Handler.php.
3.	Handler calculates the HTTP status code.
4.	Handler calls TelegramErrorLogger.
5.	TelegramErrorLogger formats and sends a professional Telegram message.
6.	Handler returns safe JSON response to the API client.
Flow for frontend/client errors:
7.	Frontend catches JavaScript or UI error.
8.	Frontend sends POST request to /api/client-errors.
9.	Laravel validates the error payload.
10.	TelegramErrorLogger sends a frontend error alert to Telegram.
5. Environment Configuration
Add these values to the Laravel .env file. Use a real token only on your own local machine. Do not commit .env to GitHub.
.env
TELEGRAM_LOG_ENABLED=true
TELEGRAM_BOT_TOKEN="PASTE_YOUR_REAL_BOT_TOKEN_HERE"
TELEGRAM_CHAT_ID="PASTE_YOUR_CHAT_ID_HERE"
TELEGRAM_LOG_ONLY_API=true
TELEGRAM_LOG_THROTTLE_SECONDS=30

Note: For classroom testing, set TELEGRAM_LOG_THROTTLE_SECONDS=1 so students can test many errors quickly.

6. How to Find Telegram Chat ID
11.	Open Telegram and search your bot username.
12.	Click Start and send a message such as hello.
13.	Run the PowerShell command below using your real bot token.
14.	Find result.message.chat.id in the response.
PowerShell: getUpdates
$token = "PASTE_YOUR_BOT_TOKEN_HERE"
Invoke-RestMethod "https://api.telegram.org/bot$token/getUpdates" | ConvertTo-Json -Depth 20

PowerShell: print only latest chat ID
$token = "PASTE_YOUR_BOT_TOKEN_HERE"
$res = Invoke-RestMethod "https://api.telegram.org/bot$token/getUpdates"
$res.result[-1].message.chat.id

7. Update config/services.php
Add this array inside the return array in config/services.php:
config/services.php
'telegram_log' => [
    'enabled' => env('TELEGRAM_LOG_ENABLED', false),
    'bot_token' => env('TELEGRAM_BOT_TOKEN'),
    'chat_id' => env('TELEGRAM_CHAT_ID'),
    'only_api' => env('TELEGRAM_LOG_ONLY_API', true),
    'throttle_seconds' => env('TELEGRAM_LOG_THROTTLE_SECONDS', 30),
],

8. Create TelegramErrorLogger Service
Create app/Services/TelegramErrorLogger.php. This service is responsible for checking config, masking sensitive data, formatting the message, throttling repeated errors, and sending the message to Telegram.
app/Services/TelegramErrorLogger.php - classroom simplified version
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
            if (! config('services.telegram_log.enabled')) {
                return;
            }
 
            if (config('services.telegram_log.only_api') && ! $request->is('api/*') && ! $request->expectsJson()) {
                return;
            }
 
            $signature = sha1(get_class($exception) . $exception->getMessage() . $request->path());
            $seconds = (int) config('services.telegram_log.throttle_seconds', 30);
 
            if (! Cache::add('telegram_error_log:' . $signature, true, now()->addSeconds($seconds))) {
                return;
            }
 
            $this->sendMessage($this->buildMessage($exception, $request, $statusCode));
        } catch (Throwable $telegramException) {
            Log::error('Telegram error logger failed.', [
                'message' => $telegramException->getMessage(),
            ]);
        }
    }
 
    private function sendMessage(string $message): void
    {
        $token = config('services.telegram_log.bot_token');
        $chatId = config('services.telegram_log.chat_id');
 
        if (! $token || ! $chatId) {
            Log::warning('Telegram token or chat ID is missing.');
            return;
        }
 
        Http::timeout(8)->asForm()->post("https://api.telegram.org/bot{$token}/sendMessage", [
            'chat_id' => $chatId,
            'text' => Str::limit($message, 3900, "
 
...message trimmed"),
            'parse_mode' => 'HTML',
            'disable_web_page_preview' => true,
        ]);
    }
 
    private function buildMessage(Throwable $exception, Request $request, int $statusCode): string
    {
        $file = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $exception->getFile());
 
        return
            "🚨 <b>Laravel API Error Alert</b>
" .
            "━━━━━━━━━━━━━━━━━━━━
 
" .
            "🧩 <b>Application</b>
" .
            "• App: <code>" . $this->e(config('app.name')) . "</code>
" .
            "• Environment: <code>" . $this->e(config('app.env')) . "</code>
" .
            "• Time: <code>" . $this->e(now()->format('Y-m-d H:i:s')) . "</code>
 
" .
            "🔥 <b>Error Summary</b>
" .
            "• Status Code: <code>" . $this->e($statusCode) . "</code>
" .
            "• Exception: <code>" . $this->e(class_basename($exception)) . "</code>
" .
            "• Message: <code>" . $this->e(Str::limit($exception->getMessage(), 500)) . "</code>
 
" .
            "🌐 <b>Request Info</b>
" .
            "• Method: <code>" . $this->e($request->method()) . "</code>
" .
            "• URL: <code>" . $this->e($request->fullUrl()) . "</code>
" .
            "• IP: <code>" . $this->e($request->ip()) . "</code>
 
" .
            "📍 <b>Location</b>
" .
            "<code>" . $this->e($file . ':' . $exception->getLine()) . "</code>";
    }
 
    private function e(mixed $value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

Note: For real projects, use the full version with maskSensitiveData(), safeJson(), shortTrace(), and sendClientError(). The simplified version is easier for students to understand first.

9. Update app/Exceptions/Handler.php
The Handler should return safe JSON to the client and send real details to Telegram.
app/Exceptions/Handler.php
<?php
 
namespace App\Exceptions;
 
use App\Services\TelegramErrorLogger;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;
 
class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];
 
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
        if ($e instanceof ValidationException) return 422;
        if ($e instanceof AuthenticationException) return 401;
        if ($e instanceof AuthorizationException) return 403;
        if ($e instanceof HttpExceptionInterface) return $e->getStatusCode();
 
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

10. Client/Frontend Error Endpoint
This endpoint lets a frontend app report JavaScript errors to the Laravel API.
app/Http/Controllers/Api/ClientErrorController.php
<?php
 
namespace App\Http\Controllers\Api;
 
use App\Http\Controllers\Controller;
use App\Services\TelegramErrorLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
 
class ClientErrorController extends Controller
{
    public function store(Request $request, TelegramErrorLogger $logger): JsonResponse
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
 
        $logger->sendClientError($data, $request);
 
        return response()->json([
            'success' => true,
            'message' => 'Client error logged successfully.',
        ]);
    }
}

11. Test Routes
Add these test routes to routes/api.php during class.
routes/api.php
use App\Http\Controllers\Api\ClientErrorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
 
Route::post('/client-errors', [ClientErrorController::class, 'store']);
 
Route::get('/test-telegram-error', function () {
    throw new RuntimeException('Testing Telegram 500 server error');
});
 
Route::get('/test-telegram-404', function () {
    abort(404, 'Testing Telegram 404 not found');
});
 
Route::get('/test-telegram-403', function () {
    abort(403, 'Testing Telegram 403 forbidden');
});
 
Route::post('/test-telegram-validation', function (Request $request) {
    $request->validate([
        'name' => ['required', 'string'],
        'email' => ['required', 'email'],
    ]);
 
    return response()->json([
        'success' => true,
        'message' => 'Validation passed',
    ]);
});

12. Testing Checklist
Test	Method	URL	Expected Result
500 error	GET	/api/test-telegram-error	API returns 500 JSON, Telegram gets error alert.
404 error	GET	/api/test-telegram-404	API returns resource not found, Telegram gets alert.
403 error	GET	/api/test-telegram-403	API returns forbidden, Telegram gets alert.
Validation	POST	/api/test-telegram-validation	API returns 422 with validation errors.
Client error	POST	/api/client-errors	API returns success true, Telegram gets frontend alert.
Postman body for validation test:
JSON body
{
  "name": "",
  "email": "wrong-email"
}

Postman body for frontend/client error test:
JSON body
{
  "message": "Cannot read properties of undefined",
  "url": "http://localhost:3000/products",
  "source": "products/page.tsx",
  "line": 25,
  "column": 10,
  "stack": "TypeError: Cannot read properties of undefined",
  "extra": {
    "page": "Products",
    "action": "Load product list"
  }
}

13. Useful PowerShell Commands
PowerShell
php artisan optimize:clear
php artisan serve
php artisan route:list
Get-Content storage\logs\laravel.log -Tail 100

Direct Telegram test
$token = "PASTE_YOUR_BOT_TOKEN_HERE"
$chatId = "PASTE_YOUR_CHAT_ID_HERE"
Invoke-RestMethod -Method Post `
  -Uri "https://api.telegram.org/bot$token/sendMessage" `
  -Body @{
    chat_id = $chatId
    text = "Laravel Telegram direct test working"
  }

14. Troubleshooting Guide
Problem	Likely Cause	Fix
getUpdates returns result: []	Bot has no messages yet.	Open bot in Telegram, click Start, send hello, then run getUpdates again.
Telegram API returns 404 Not Found	Wrong token or placeholder token used.	Use real token. If exposed, revoke and create a new token.
No Telegram message but API returns 500	Config cache still using old .env.	Run php artisan optimize:clear.
Same error not sent repeatedly	Throttle is active.	Set TELEGRAM_LOG_THROTTLE_SECONDS=1 during testing.
Client sees only Internal server error.	This is correct production behavior.	Real details should go to Telegram and Laravel log only.
15. Teaching Plan
Time	Topic	Activity
0-15 min	Why error logging matters	Show difference between client error response and developer alert.
15-35 min	Telegram bot setup	Create bot, get token, get chat ID, test direct message.
35-60 min	Laravel config	Add .env values and config/services.php settings.
60-100 min	Service + Handler	Create TelegramErrorLogger and update Handler.php.
100-125 min	Test backend errors	Test 500, 404, 403, 422 routes.
125-150 min	Frontend error endpoint	Send frontend error payload from Postman.
150-180 min	Review + exercises	Students customize message format and add security improvements.
16. Student Exercises
Exercise 1: Add a new /api/test-telegram-400 route using abort(400, "Bad request test").
Exercise 2: Add request payload to the Telegram message and make sure password/token fields are hidden.
Exercise 3: Add user email to Telegram message when the request has an authenticated user.
Exercise 4: Create separate Telegram chat IDs for local/staging/production environments.
Exercise 5: Make frontend JavaScript send window.onerror details to /api/client-errors.
17. Homework
•	Create one Laravel controller that intentionally throws an exception and verify the Telegram alert.
•	Customize the Telegram message design with your own app name, module name, and severity level.
•	Write a short explanation: why should API users not see real stack traces in production?
•	Push the project to GitHub without .env and without any real token.
18. Quick Assessment Questions
15.	What is the purpose of app/Exceptions/Handler.php?
16.	Why should the Telegram bot token stay inside .env?
17.	What is the difference between a 500 error and a 422 validation error?
18.	Why do we mask password, token, and authorization values before logging?
19.	Why does the client receive Internal server error while Telegram receives the real exception?
19. Final Project Checklist
•	Bot token and chat ID configured in .env.
•	config/services.php has telegram_log config.
•	TelegramErrorLogger service exists.
•	Handler.php sends exception to Telegram and returns safe JSON.
•	/api/client-errors endpoint works.
•	500, 404, 403, and 422 test routes work.
•	Sensitive values are not sent to Telegram.
•	APP_DEBUG=false in production.
Best Practice: End the class by reminding students: a good error logging system helps developers fix bugs faster without exposing private technical details to users.

