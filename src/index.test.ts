import { describe, it, expect, vi } from "vitest";
import { main } from "./index.js";

describe("main", () => {
  it("should log to console", () => {
    const consoleSpy = vi.spyOn(console, "log");
    main();
    expect(consoleSpy).toHaveBeenCalledWith("Repo standards utilities loaded.");
  });
});
