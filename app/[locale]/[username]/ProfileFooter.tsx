import { useTranslations } from "next-intl";
import { LanguageSelector } from "@/components/LanguageSelector";
import Link from "next/link";

export function ProfileFooter() {
    const t = useTranslations("PublicProfile");

    return (
        <footer className="mt-8 flex flex-col items-center gap-4 text-center text-xs text-muted-foreground pb-8">
            <div>
                Powered by <span className="font-medium">LinkID</span>
                <span className="mx-2">•</span>
                <Link href="/contact-us" className="hover:underline">{t("reportProfile")}</Link>
            </div>
            <LanguageSelector />
        </footer>
    );
}
