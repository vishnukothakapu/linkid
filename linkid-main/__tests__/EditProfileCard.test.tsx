import { fireEvent, render, screen } from "@testing-library/react";
import EditProfileCard from "@/app/profile/EditProfileCard";

describe("EditProfileCard bio character counter", () => {
    it("initializes from the saved bio and updates its warning and limit states", () => {
        render(
            <EditProfileCard
                initialName="Alex"
                initialUsername="alex"
                initialBio={"a".repeat(144)}
            />
        );

        const bio = screen.getByRole("textbox", { name: "Bio" });
        const counter = screen.getByText("144 / 160");

        expect(bio).toHaveAttribute("maxLength", "160");
        expect(bio).toHaveAttribute("aria-describedby", "bio-character-count");
        expect(counter).toHaveClass("text-muted-foreground");

        fireEvent.change(bio, { target: { value: "a".repeat(145) } });
        expect(screen.getByText("145 / 160")).toHaveClass("text-amber-700");

        fireEvent.change(bio, { target: { value: "a".repeat(160) } });
        expect(screen.getByText("160 / 160")).toHaveClass("text-red-600");
    });
});
