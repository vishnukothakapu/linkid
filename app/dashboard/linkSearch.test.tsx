import { filterLinksBySearch } from "./linkSearch";
import type { Link as ProfileLink } from "@/app/[username]/types/type";

const makeLink = (overrides: Partial<ProfileLink>): ProfileLink => ({
    id: "link-1",
    label: "Example",
    createdAt: new Date("2026-01-01"),
    platform: "website",
    url: "https://example.com",
    position: 0,
    clicks: 0,
    isPublic: true,
    isGroup: false,
    workspaceId: "workspace-1",
    ...overrides,
});

describe("filterLinksBySearch", () => {
    const links = [
        makeLink({ id: "one", label: "Portfolio", url: "https://padmaja.dev" }),
        makeLink({ id: "two", label: "Blog", url: "https://example.com/articles" }),
        makeLink({
            id: "group",
            label: "Social media",
            isGroup: true,
            url: "",
            children: [
                makeLink({ id: "child-one", label: "GitHub", url: "https://github.com/user" }),
                makeLink({ id: "child-two", label: "LinkedIn", url: "https://linkedin.com/in/user" }),
            ],
        }),
    ];

    it("returns all links when the search is empty", () => {
        expect(filterLinksBySearch(links, " ")).toEqual(links);
    });

    it("matches link titles without regard to case", () => {
        expect(filterLinksBySearch(links, "PORTFOLIO").map((link) => link.id)).toEqual(["one"]);
    });

    it("matches URLs", () => {
        expect(filterLinksBySearch(links, "linkedin.com")[0].children?.map((link) => link.id)).toEqual(["child-two"]);
    });

    it("keeps a group when one of its children matches and hides other children", () => {
        const result = filterLinksBySearch(links, "github");
        expect(result.map((link) => link.id)).toEqual(["group"]);
        expect(result[0].children?.map((link) => link.id)).toEqual(["child-one"]);
    });

    it("does not show all children when only the group name matches", () => {
        expect(filterLinksBySearch(links, "social media")).toEqual([]);
    });

    it("returns no links when nothing matches", () => {
        expect(filterLinksBySearch(links, "not-found")).toEqual([]);
    });
});
