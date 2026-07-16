import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const runtime = 'edge';

export async function middleware(request) {
    const url = new URL(request.url);
    
    // Only rate limit the /api/analyze endpoint
    if (url.pathname === '/api/analyze') {
        // Bulletproof IP Extraction Logic
        const ip = request.ip || 
                   request.headers.get('x-real-ip') || 
                   request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                   '127.0.0.1';

        const key = `ratelimit:${ip}`;
        const limit = 20; // Maximum 20 scans per 24 hours
        
        try {
            // Absolute Atomic Transactions (Race Conditions Bypass)
            const currentCount = await kv.incr(key);
            if (currentCount === 1) {
                await kv.expire(key, 86400); // Expiry only on first request (24 Hours)
            }
            
            // Get TTL to calculate Retry-After header
            const ttl = await kv.ttl(key);
            const retryAfter = ttl > 0 ? ttl : 86400;

            if (currentCount > limit) {
                // Return standard HTTP Status Code 429 and Retry-After header
                return new NextResponse(
                    JSON.stringify({
                        success: false,
                        error: "Your search limit has been reached. Please try again after 24 hours."
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
            }
            
            // Allow request but add headers for information
            const response = NextResponse.next();
            response.headers.set('X-RateLimit-Limit', String(limit));
            response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - currentCount)));
            response.headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + retryAfter));
            return response;
            
        } catch (err) {
            // Log error and allow request as fallback
            console.error("Vercel KV Rate Limit Error:", err);
            return NextResponse.next();
        }
    }
    
    return NextResponse.next();
}
