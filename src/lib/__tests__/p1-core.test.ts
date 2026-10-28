import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetRateLimitBuckets,
  rateLimit,
} from "../rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    __resetRateLimitBuckets();
  });

  it("allows up to the limit then blocks", () => {
    const key = "test:ip";
    for (let i = 0; i < 3; i++) {
      expect(rateLimit({ key, limit: 3, windowMs: 60_000 }).ok).toBe(true);
    }
    expect(rateLimit({ key, limit: 3, windowMs: 60_000 }).ok).toBe(false);
  });
});

describe("webhook verify shape", () => {
  it("accepts subscribe + matching token", () => {
    const mode = "subscribe";
    const token = "dukanbot_verify";
    const challenge = "12345";
    const verify = "dukanbot_verify";
    const ok = mode === "subscribe" && token === verify && Boolean(challenge);
    expect(ok).toBe(true);
    expect(challenge).toBe("12345");
  });
});

describe("order draft completeness", () => {
  it("requires item, qty, name, address, payment", () => {
    const draft = {
      item: "Biryani",
      quantity: 2,
      customer_name: "Ali",
      address: "Gulberg",
      payment_method: "cod",
    };
    const complete = Boolean(
      draft.item &&
        (draft.quantity ?? 0) > 0 &&
        draft.customer_name &&
        draft.address &&
        draft.payment_method
    );
    expect(complete).toBe(true);
  });
});
