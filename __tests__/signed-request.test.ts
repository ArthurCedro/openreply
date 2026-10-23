import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "crypto";
import { parseSignedRequest } from "../lib/meta/signed-request";

beforeEach(() => {
  vi.stubEnv("INSTAGRAM_APP_SECRET", "ig_secret_test");
  vi.stubEnv("FACEBOOK_APP_SECRET", "fb_secret_test");
});

function sign(payload: object, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${sig}.${encoded}`;
}

describe("parseSignedRequest", () => {
  const payload = { algorithm: "HMAC-SHA256", user_id: "123", issued_at: 1 };

  it("accepts a request signed with the Instagram app secret", () => {
    expect(parseSignedRequest(sign(payload, "ig_secret_test"))?.user_id).toBe("123");
  });

  it("accepts a request signed with the Facebook app secret", () => {
    expect(parseSignedRequest(sign(payload, "fb_secret_test"))?.user_id).toBe("123");
  });

  it("rejects a request signed with another secret", () => {
    expect(parseSignedRequest(sign(payload, "wrong"))).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(parseSignedRequest(null)).toBeNull();
    expect(parseSignedRequest("garbage")).toBeNull();
    expect(parseSignedRequest("a.%%%")).toBeNull();
  });
});
