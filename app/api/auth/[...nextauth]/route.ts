import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { globalAuthCircuitBreaker, CircuitBreakerError } from "@/lib/circuit-breaker";
import { NextResponse } from "next/server";

const handler = NextAuth(authOptions);

const wrappedHandler = async (req: Request, res: any) => {
    try {
        return await globalAuthCircuitBreaker.fire(() => handler(req, res));
    } catch (error) {
        if (error instanceof CircuitBreakerError) {
            return new NextResponse("Service Unavailable - Authentication Provider Down", { status: 503 });
        }
        throw error;
    }
};

export { wrappedHandler as GET, wrappedHandler as POST };
