import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, BadgeCheckIcon } from "lucide-react";
import { ConnectedAccounts } from "./ConnectedAccounts";

export function AccountInfoCard({ user }: { user: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    Account Information
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{user.email}</span>
                    </div>

                    <Badge variant="secondary" className="flex items-center gap-1">
                        <BadgeCheckIcon className="h-3 w-3" />
                        Verified
                    </Badge>
                </div>

                <div>
                    <h3 className="mb-2 text-sm font-medium">
                        Connected Accounts
                    </h3>

                    <ConnectedAccounts accounts={user.accounts} />
                </div>
            </CardContent>
        </Card>
    );
}
 