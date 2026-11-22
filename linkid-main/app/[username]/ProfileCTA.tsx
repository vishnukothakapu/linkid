import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function ProfileCTA() {
    return (
        <div className="pt-6 mt-6 border-t text-center space-y-3">
            <p className="text-sm text-muted-foreground">
                Want to create your own LinkID?
            </p>

            <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
                Create your LinkID
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    );
}
