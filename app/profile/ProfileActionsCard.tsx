import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Link2 } from "lucide-react";

export function ProfileActionsCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline">
                    <Link2 className="h-4 w-4" />
                    Connect Account
                </Button>

                <form
                    action="/api/auth/signout"
                    method="post"
                    className="flex-1"
                >
                    <Button variant="destructive" type="submit" className="">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
