import { NextResponse } from 'next/server';
import { createClient } from 'redis';

// Reusable single Redis client instance across requests
let redisClientSingleton = null;

async function getRedisClient() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL environment variable is missing");
    }

    if (!redisClientSingleton) {
        redisClientSingleton = createClient({
            url: redisUrl,
            socket: {
                connectTimeout: 5000,
                reconnectStrategy: retries => Math.min(retries * 100, 3000)
            }
        });

        redisClientSingleton.on('error', (err) => {
            console.error('[REDIS CLIENT ERROR]', err.message || err);
        });
    }

    if (!redisClientSingleton.isOpen) {
        await redisClientSingleton.connect();
    }

    return redisClientSingleton;
}

export async function middleware(request) {
    const url = new URL(request.url);
    
    // Only rate limit the /api/analyze endpoint
    if (url.pathname === '/api/analyze') {
        // IP Extraction Logic
        const ip = request.ip || 
                   request.headers.get('x-real-ip') || 
                   request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   '127.0.0.1';

        // Shared network resolution: Extract per-session cookie or x-client-id header
        let clientId = request.cookies.get('seo_client_id')?.value || request.headers.get('x-client-id');
        let newCookieToSet = null;

        if (!clientId) {
            clientId = 'c_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
            newCookieToSet = clientId;
        }

        const key = `ratelimit:${ip}:${clientId}`;
        const limit = 3; // 3 scans per 24 hours per session/IP combo
        
        try {
            // Attempt Redis Rate Limiting using process.env.REDIS_URL
            const redis = await getRedisClient();
            const currentCount = await redis.incr(key);
            
            if (currentCount === 1) {
                await redis.expire(key, 86400); // 24 Hours rolling window
            }
            
            const ttl = await redis.ttl(key);
            const retryAfter = ttl > 0 ? ttl : 86400;

            if (currentCount > limit) {
                const limitResp = new NextResponse(
                    JSON.stringify({
                        success: false,
                        error: "Your daily search limit has been reached. Please try again after 24 hours."
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': String(retryAfter),
                            'X-RateLimit-Limit': String(limit),
                            'X-RateLimit-Remaining': '0',
                            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfter)
                        }
                    }
                );
                if (newCookieToSet) {
                    limitResp.cookies.set('seo_client_id', newCookieToSet, { path: '/', maxAge: 31536000, sameSite: 'lax' });
                }
                return limitResp;
            }
            
            const response = NextResponse.next();
            response.headers.set('X-RateLimit-Limit', String(limit));
            response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - currentCount)));
            response.headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + retryAfter));
            if (newCookieToSet) {
                response.cookies.set('seo_client_id', newCookieToSet, { path: '/', maxAge: 31536000, sameSite: 'lax' });
            }
            return response;
            
        } catch (err) {
            // LOG error clearly in Vercel logs AND fall back to Tier 2 cookie-based limiter
            console.error("REDIS_RATE_LIMITER_ERROR (Engaging Tier 2 Cookie Fallback):", err.message || err);

            const trackerCookie = request.cookies.get('seo_scan_tracker')?.value;
            let scanCount = 0;
            let firstScanTime = Date.now();

            if (trackerCookie) {
                const parts = trackerCookie.split(':');
                if (parts.length === 2) {
                    const parsedCount = parseInt(parts[0], 10);
                    const parsedTime = parseInt(parts[1], 10);
                    if (!isNaN(parsedCount) && !isNaN(parsedTime)) {
                        if (Date.now() - parsedTime < 86400000) {
                            scanCount = parsedCount;
                            firstScanTime = parsedTime;
                        }
                    }
                }
            }

            scanCount += 1;
            const newTrackerValue = `${scanCount}:${firstScanTime}`;

            if (scanCount > limit) {
                const limitResp = new NextResponse(
                    JSON.stringify({
                        success: false,
                        error: "Your daily search limit has been reached. Please try again after 24 hours."
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json',
                            'Retry-After': '86400',
                            'X-RateLimit-Limit': String(limit),
                            'X-RateLimit-Remaining': '0'
                        }
                    }
                );
                if (newCookieToSet) {
                    limitResp.cookies.set('seo_client_id', newCookieToSet, { path: '/', maxAge: 31536000, sameSite: 'lax' });
                }
                limitResp.cookies.set('seo_scan_tracker', newTrackerValue, { path: '/', maxAge: 86400, sameSite: 'lax' });
                return limitResp;
            }

            const response = NextResponse.next();
            response.headers.set('X-RateLimit-Limit', String(limit));
            response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - scanCount)));
            if (newCookieToSet) {
                response.cookies.set('seo_client_id', newCookieToSet, { path: '/', maxAge: 31536000, sameSite: 'lax' });
            }
            response.cookies.set('seo_scan_tracker', newTrackerValue, { path: '/', maxAge: 86400, sameSite: 'lax' });
            return response;
        }
    }
    
    return NextResponse.next();
}
