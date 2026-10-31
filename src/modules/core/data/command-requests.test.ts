import { describe, expect, it } from "vitest";
import { isDuplicateRequest } from "./command-requests";

describe("isDuplicateRequest", () => {
  it("accepts only a unique violation on command_requests", () => {
    expect(isDuplicateRequest({ code: "P2002", meta: { modelName: "CommandRequest" } })).toBe(true);
    expect(isDuplicateRequest({ code: "P2002", meta: { modelName: "Payment" } })).toBe(false);
    expect(isDuplicateRequest({ code: "P2002" })).toBe(false);
    expect(isDuplicateRequest({ code: "P2025", meta: { modelName: "CommandRequest" } })).toBe(false);
    expect(isDuplicateRequest(new Error("boom"))).toBe(false);
  });
});
