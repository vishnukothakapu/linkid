import { getServerSession } from "next-auth";
import { redirect } from "@/i18n/routing";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { resolveActiveWorkspace } from "@/lib/workspace";
import ClientAuthFlow from "./ClientAuthFlow";

export default async function ExtensionAuthPage({ searchParams }: { searchParams: Promise<{ extId?: string | string[] }> }) {
  const session = await getServerSession(authOptions);
  const resolvedSearchParams = await searchParams;
  
  if (!session?.user?.email) {
    let redirectUrl = "/login?callbackUrl=/extension-auth";
    if (typeof resolvedSearchParams.extId === 'string') {
      redirectUrl += encodeURIComponent(`?extId=${resolvedSearchParams.extId}`);
    }
    
    // `redirect` from i18n/routing resolves href properly for internal routes.
    // However, it does not support query strings gracefully in simple strings in all versions unless configured.
    // Using string works generally.
    redirect(redirectUrl);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const workspace = await resolveActiveWorkspace(user.id);

  if (!workspace?.username) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950 sm:px-6 lg:px-8">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100 via-zinc-50 to-zinc-50 dark:from-violet-900/20 dark:via-zinc-950 dark:to-zinc-950 -z-10" />
       
       <div className="w-full max-w-md">
         <div className="rounded-3xl border border-white/70 bg-white/70 p-8 shadow-2xl shadow-violet-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70">
           <ClientAuthFlow username={workspace.username} />
         </div>
       </div>
    </div>
  );
}
