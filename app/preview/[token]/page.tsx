import { resolvePreviewToken, ProfileSnapshot } from "@/lib/profileWorkflow";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ProfileCard } from "@/app/[username]/ProfileCard";
import { ProfileFooter } from "@/app/[username]/ProfileFooter";

export const metadata: Metadata = {
  title: "Profile Preview",
  description: "Previewing a LinkID profile before publishing",
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PreviewPage({ params }: PageProps) {
  const { token } = await params;

  const result = await resolvePreviewToken(token);

  if (!result) {
    notFound();
  }

  const { snapshot } = result;

  const profileData = {
    user: {
      name: snapshot.name,
      username: snapshot.username || "unknown",
      bio: snapshot.bio,
      image: snapshot.image,
      links: [], // Preview doesn't show links, only profile info
    },
    username: snapshot.username || "unknown",
    showCTA: false,
    isOwner: false,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Preview Banner */}
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-600">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            This is a preview of your profile before publishing. Changes are not live yet.
          </AlertDescription>
        </Alert>

        {/* Profile Card */}
        <ProfileCard {...profileData} />

        {/* Profile Footer */}
        <ProfileFooter />
      </div>
    </div>
  );
}
