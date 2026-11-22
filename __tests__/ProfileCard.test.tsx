import { render, screen } from "@testing-library/react";
import { ProfileCard } from "@/app/[username]/ProfileCard";
import { Link } from "@/app/[username]/types/type";

describe("ProfileCard", () => {
    it("adds a descriptive accessible label to social icon links", () => {
        const socialLink: Link = {
            id: "social-link",
            label: "GitHub",
            createdAt: new Date(),
            platform: "github",
            url: "https://github.com/example",
            position: 0,
            clicks: 0,
            isPublic: true,
            isGroup: false,
            isSocialIcon: true,
            workspaceId: "workspace",
        };

        render(
            <ProfileCard
                user={{
                    name: "Example",
                    username: "example",
                    bio: null,
                    image: null,
                    links: [socialLink],
                }}
                username="example"
                showCTA={false}
                isOwner={false}
            />
        );

        expect(screen.getByRole("link", { name: "Visit GitHub" })).toBeInTheDocument();
    });
});
