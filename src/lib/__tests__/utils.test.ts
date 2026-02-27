import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("cn()", () => {
    it("concatenates simple class strings", () => {
        expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("filters out falsy values", () => {
        expect(cn("foo", false && "bar", undefined, null as unknown as string, "baz")).toBe("foo baz");
    });

    it("handles conditional object syntax (clsx-style)", () => {
        expect(cn("base", { active: true, disabled: false })).toBe("base active");
    });

    it("deduplicates conflicting Tailwind classes via twMerge", () => {
        // tailwind-merge keeps the LAST conflicting class
        expect(cn("p-2", "p-4")).toBe("p-4");
        expect(cn("text-red-500", "text-blue-700")).toBe("text-blue-700");
    });

    it("returns an empty string when called with no args", () => {
        expect(cn()).toBe("");
    });

    it("handles array inputs", () => {
        expect(cn(["a", "b"], "c")).toBe("a b c");
    });
});
