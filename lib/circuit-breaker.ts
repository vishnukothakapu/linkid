export class CircuitBreakerError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CircuitBreakerError";
    }
}

export enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN,
}

export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeout?: number;
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount = 0;
    private failureThreshold: number;
    private resetTimeout: number;
    private nextAttempt = 0;

    constructor(options?: CircuitBreakerOptions) {
        this.failureThreshold = options?.failureThreshold || 5;
        this.resetTimeout = options?.resetTimeout || 30000; // 30 seconds
    }

    public async fire<T>(action: () => Promise<T>, ignoreErrors: string[] = []): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() > this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
            } else {
                throw new CircuitBreakerError("Circuit is OPEN. Service unavailable.");
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error: any) {
            // Ignore business logic errors (don't trip the circuit breaker)
            if (error?.code && ignoreErrors.includes(error.code)) {
                throw error;
            }
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failureCount = 0;
        this.state = CircuitState.CLOSED;
    }

    private onFailure(): void {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
            this.nextAttempt = Date.now() + this.resetTimeout;
        }
    }
}

// Global instances for shared state across the serverless instance
export const globalDbCircuitBreaker = new CircuitBreaker();
export const globalAuthCircuitBreaker = new CircuitBreaker();
