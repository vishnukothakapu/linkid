"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { ChangeEvent, useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LanguageSelector() {
    const t = useTranslations("Common");
    const locale = useLocale();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const pathname = usePathname();

    function onSelectChange(value: string) {
        startTransition(() => {
            router.replace(pathname, { locale: value });
        });
    }

    return (
        <Select defaultValue={locale} onValueChange={onSelectChange} disabled={isPending}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder={t("language")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">{t("english")}</SelectItem>
                <SelectItem value="es">{t("spanish")}</SelectItem>
            </SelectContent>
        </Select>
    );
}
