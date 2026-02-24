<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ResponseCache
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  int|null  $ttl  Cache time in seconds
     * @return mixed
     */
    public function handle(Request $request, Closure $next, $ttl = null)
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Don't cache if caching is disabled
        if (!config('app.response_cache_enabled', false)) {
            return $next($request);
        }

        // Skip caching for authenticated requests (optional - remove if you want to cache auth)
        // if ($request->user()) {
        //     return $next($request);
        // }

        // Generate cache key from URL and query parameters
        $cacheKey = $this->generateCacheKey($request);

        // Check if we have a cached response
        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            return response()->json($cachedResponse['data'], $cachedResponse['status'])
                ->header('X-Cache', 'HIT')
                ->withHeaders($cachedResponse['headers'] ?? []);
        }

        // Process the request
        $response = $next($request);

        // Only cache successful JSON responses
        if ($response->isSuccessful() && $response->headers->get('content-type') === 'application/json') {
            $ttl = $ttl ?? config('app.response_cache_lifetime', 3600);
            
            Cache::put($cacheKey, [
                'data' => json_decode($response->getContent(), true),
                'status' => $response->getStatusCode(),
                'headers' => [
                    'Content-Type' => 'application/json',
                    'X-Cache' => 'MISS',
                ]
            ], $ttl);

            $response->header('X-Cache', 'MISS');
        }

        return $response;
    }

    /**
     * Generate a unique cache key for the request
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    protected function generateCacheKey(Request $request): string
    {
        $url = $request->fullUrl();
        $user = $request->user();
        
        // Include user ID in cache key for personalized content
        $userId = $user ? $user->id : 'guest';
        
        return 'response_cache:' . md5($url . ':' . $userId);
    }

    /**
     * Clear cache for specific routes
     *
     * @param  string  $pattern
     * @return void
     */
    public static function clearCache(string $pattern = '*'): void
    {
        $keys = Cache::get('response_cache:' . $pattern);
        if ($keys) {
            foreach ($keys as $key) {
                Cache::forget($key);
            }
        }
    }
}
