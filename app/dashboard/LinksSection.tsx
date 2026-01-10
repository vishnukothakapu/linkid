import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddLinkBox from "./AddLinkBox";
import { EmptyLinksState } from "./EmptyLinksState";
import { LinkItem } from "./LinkItem";

export function LinksSection({
    links,
    username,
    showAdd,
    setShowAdd,
    onAdd,
    onUpdate,
    onDelete,
}: any) {
    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <CardTitle>Your Links</CardTitle>
                <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
                    <Plus className="h-4 w-4" />
                    Add Link
                </Button>
            </CardHeader>

            <CardContent className="space-y-4">
                {showAdd && <AddLinkBox onAdded={onAdd} />}

                {links.length === 0 && !showAdd && (
                    <EmptyLinksState onAdd={() => setShowAdd(true)} />
                )}

                {links.map((link: any) => (
                    <LinkItem
                        key={link.id}
                        link={link}
                        username={username}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
