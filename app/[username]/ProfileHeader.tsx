export function ProfileHeader({
    name,
    username,
}: {
    name?: string | null;
    username: string;
}) {
    return (
        <div className="text-center space-y-2">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-2xl font-bold">
                {(name ?? username)[0]?.toUpperCase()}
            </div>

            <div>
                <h1 className="text-2xl font-bold">{name ?? username}</h1>
                <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
        </div>
    );
}
