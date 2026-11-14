import { PrismaClient } from "@prisma/client";
import {
  computeStateDelta,
  eventBus,
  getAuditContext,
  sanitizeAuditState,
  type AuditResource,
} from "./event-bus";

const AUDITED_MODELS = new Set<AuditResource>(["User", "Link"]);

function createExtendedPrismaClient() {
  const baseClient = new PrismaClient();

  eventBus.registerWriter(async (event) => {
    await baseClient.auditLog.create({
      data: {
        eventId: event.eventId,
        actorId: event.actorId,
        actionType: event.actionType,
        resource: event.resource,
        resourceId: event.resourceId,
        oldState: event.oldState,
        newState: event.newState,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      },
    });
  });

  return baseClient.$extends({
    name: "audit-event-sourcing",
    query: {
      $allModels: {
        async create({ model, args, query }) {
          const result = await query(args);
          const ctx = getAuditContext();

          if (ctx && AUDITED_MODELS.has(model as AuditResource)) {
            const record = result as Record<string, unknown>;
            const resourceId = String(record?.id ?? ctx.actorId);
            const actionPrefix = model === "User" ? "PROFILE" : "LINK";

            eventBus.publish({
              actorId: ctx.actorId,
              actionType: `${actionPrefix}.CREATE`,
              resource: model as AuditResource,
              resourceId,
              oldState: null,
              newState: sanitizeAuditState(record),
              ipAddress: ctx.ipAddress,
              userAgent: ctx.userAgent,
            });
          }

          return result;
        },

        async update({ model, args, query }) {
          const ctx = getAuditContext();
          const isAudited = ctx && AUDITED_MODELS.has(model as AuditResource);

          let beforeRecord: Record<string, unknown> | null = null;
          if (isAudited && args.where) {
            const delegate = (
              baseClient as unknown as Record<
                string,
                { findUnique: (a: unknown) => Promise<unknown> }
              >
            )[model.charAt(0).toLowerCase() + model.slice(1)];
            if (delegate?.findUnique) {
              const found = await delegate.findUnique({ where: args.where });
              beforeRecord = sanitizeAuditState(found);
            }
          }

          const result = await query(args);

          if (isAudited && ctx) {
            const afterRecord = sanitizeAuditState(result);
            const { oldDelta, newDelta } = computeStateDelta(
              beforeRecord,
              afterRecord
            );

            if (oldDelta || newDelta) {
              const record = result as Record<string, unknown>;
              const resourceId = String(record?.id ?? ctx.actorId);
              const actionPrefix = model === "User" ? "PROFILE" : "LINK";

              eventBus.publish({
                actorId: ctx.actorId,
                actionType: `${actionPrefix}.UPDATE`,
                resource: model as AuditResource,
                resourceId,
                oldState: oldDelta,
                newState: newDelta,
                ipAddress: ctx.ipAddress,
                userAgent: ctx.userAgent,
              });
            }
          }

          return result;
        },

        async delete({ model, args, query }) {
          const ctx = getAuditContext();
          const isAudited = ctx && AUDITED_MODELS.has(model as AuditResource);

          let beforeRecord: Record<string, unknown> | null = null;
          if (isAudited && args.where) {
            const delegate = (
              baseClient as unknown as Record<
                string,
                { findUnique: (a: unknown) => Promise<unknown> }
              >
            )[model.charAt(0).toLowerCase() + model.slice(1)];
            if (delegate?.findUnique) {
              const found = await delegate.findUnique({ where: args.where });
              beforeRecord = sanitizeAuditState(found);
            }
          }

          const result = await query(args);

          if (isAudited && ctx) {
            const record = result as Record<string, unknown>;
            const resourceId = String(record?.id ?? beforeRecord?.id ?? "");
            const actionPrefix = model === "User" ? "PROFILE" : "LINK";

            eventBus.publish({
              actorId: ctx.actorId,
              actionType: `${actionPrefix}.DELETE`,
              resource: model as AuditResource,
              resourceId,
              oldState: beforeRecord,
              newState: null,
              ipAddress: ctx.ipAddress,
              userAgent: ctx.userAgent,
            });
          }

          return result;
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<
  typeof createExtendedPrismaClient
>;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createExtendedPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}