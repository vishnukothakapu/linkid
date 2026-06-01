import { render, screen, fireEvent } from "@testing-library/react";
import AddLinkBox from "../AddLinkBox";
import toast from "react-hot-toast";

jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
    success: jest.fn(),
}));

jest.mock("@/lib/csrfClient", () => ({
    getCsrfToken: jest.fn(() => Promise.resolve("mock-csrf-token")),
}));

describe("AddLinkBox Client-Side Validation", () => {
    it("intercepts submit execution and throws 'Field cannot be empty' error when URL field is blank", async () => {
        const mockOnAdded = jest.fn();
        render(<AddLinkBox onAdded={mockOnAdded} />);

        const actionButton = screen.getByRole("button", { name: /add link/i });
        fireEvent.click(actionButton);

        expect(toast.error).toHaveBeenCalledWith("Field cannot be empty");
        expect(mockOnAdded).not.toHaveBeenCalled();
    });
});