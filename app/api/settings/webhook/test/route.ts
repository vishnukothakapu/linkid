import { webhookRoute } from "@/lib/webhookRoutes";
export const POST = (request: Request) => webhookRoute(request, true);
