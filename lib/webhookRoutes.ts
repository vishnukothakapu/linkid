import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import prisma from "./prisma";
import { NextResponse } from "next/server";
import { checkRateLimit } from "./rateLimit";
import { enqueueWorkspaceWebhook, dispatchWebhook } from "./webhooks";
export async function webhookRoute(req: Request, test: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const workspaceId =
    req.headers.get("x-workspace-id") ||
    new URL(req.url).searchParams.get("workspaceId");
  if (!workspaceId)
    return NextResponse.json(
      { error: "workspaceId required" },
      { status: 400 },
    );
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (member?.role !== "OWNER")
    return NextResponse.json(
      { error: "Only owners can inspect or test webhooks" },
      { status: 403 },
    );
  try {
    if (test) {
      if (!(await checkRateLimit(`webhook-test:${session.user.id}`, 5, 60_000)))
        return NextResponse.json(
          { error: "Too many webhook tests" },
          { status: 429 },
        );
      const queued = await prisma.$transaction((tx) =>
        enqueueWorkspaceWebhook(
          tx,
          workspaceId,
          "test.ping",
          { message: "LinkID test event" },
          undefined,
          false,
        ),
      );
      if (!queued)
        return NextResponse.json(
          { error: "Configure a webhook URL first" },
          { status: 400 },
        );
      try {
        await dispatchWebhook(prisma, queued.id, 1);
      } catch {
        /* Failure diagnostics were persisted by the dispatcher. */
      }
      const result = await prisma.webhookDelivery.findUnique({
        where: { eventId_attempt: { eventId: queued.eventId, attempt: 1 } },
        select: {
          status: true,
          statusCode: true,
          durationMs: true,
          responseBody: true,
          error: true,
        },
      });
      if (!result)
        return NextResponse.json(
          { error: "Delivery diagnostics could not be saved" },
          { status: 503 },
        );
      return NextResponse.json({ result });
    }
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { workspaceId, attempt: { gt: 0 } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        eventId: true,
        event: true,
        status: true,
        statusCode: true,
        durationMs: true,
        error: true,
        attempt: true,
        createdAt: true,
        requestBody: true,
        responseBody: true,
      },
    });
    return NextResponse.json({ deliveries });
  } catch {
    return NextResponse.json(
      { error: "Webhook diagnostics unavailable. Please retry." },
      { status: 503 },
    );
  }
}
