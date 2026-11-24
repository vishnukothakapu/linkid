import { webhookRoute } from "@/lib/webhookRoutes";
export const GET = (request: Request) => webhookRoute(request, false);
