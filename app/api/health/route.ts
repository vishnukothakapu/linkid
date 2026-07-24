import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint.
 * @returns {Promise<NextResponse>} JSON response with status, timestamp, and database connectivity.
 */
export async function GET() {
    const timeoutMs = 5000; // 5 seconds

    try {
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
        );

        // Race the DB query against the timeout
        await Promise.race([
            prisma.$queryRaw`SELECT 1`,
            timeoutPromise,
        ]);

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    } catch (error) {
        // Log the full error server-side for debugging
        console.error('Health check failed:', error);

        // Return a generic message to the client (hide internal details)
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
                error: 'Database connection failed. Please try again later.',
            },
            { status: 500 }
        );
    }
}