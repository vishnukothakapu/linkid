import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AddLinkBox from "../AddLinkBox";
import toast from "react-hot-toast";

// Explicitly declare Jest types to kill any VS Code red squiggly errors
declare const jest: any;
declare const describe: any;
declare const it: any;
declare const expect: any;

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