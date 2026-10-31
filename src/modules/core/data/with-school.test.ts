import { describe, expect, it, vi } from "vitest";
import { withSchool } from "./with-school";

describe("withSchool", () => {
  it("rejects a malformed School id before opening a transaction", async () => {
    const transaction = vi.fn();
    const fn = vi.fn();
    await expect(withSchool("x", fn, { $transaction: transaction } as never)).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
    expect(fn).not.toHaveBeenCalled();
  });
});
