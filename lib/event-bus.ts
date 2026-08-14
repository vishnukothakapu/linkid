import prisma from "@/lib/prisma";

export interface AuditEvent {
    actorId: string;
    actionType: string;
    resourceId?: string;
    oldState?: any;
    newState?: any;
    ipAddress?: string;
}

class EventBus {
    /**
     * Publishes an audit event to the database asynchronously.
     * This uses a "fire and forget" pattern by intentionally not returning the promise
     * (but wrapping it in a catch to prevent UnhandledPromiseRejection warnings),
     * enabling CQRS-lite behavior where writes don't block the HTTP response.
     */
    publish(event: AuditEvent): void {
        const payload = {
            actorId: event.actorId,
            actionType: event.actionType,
            resourceId: event.resourceId,
            oldState: event.oldState ? JSON.stringify(event.oldState) : undefined,
            newState: event.newState ? JSON.stringify(event.newState) : undefined,
            ipAddress: event.ipAddress,
        };

        // Fire and forget
        Promise.resolve().then(async () => {
            try {
                await prisma.auditLog.create({
                    data: payload,
                });
            } catch (error) {
                console.error("[EventBus] Failed to publish audit log:", error);
            }
        });
    }
}

export const eventBus = new EventBus();
