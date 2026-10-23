import { createHmac, randomBytes, timingSafeEqual } from "crypto";

export interface SignedRequestPayload {
  algorithm?: string;
  user_id?: string;
  issued_at?: number;
  [key: string]: unknown;
}

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/**
 * Parses the `signed_request` Meta posts to the deauthorize and data deletion
 * callbacks. Like webhooks, accept either app secret so the callback works
 * whichever one Meta signs with. Returns null when the signature is invalid.
 */
export function parseSignedRequest(
  signedRequest: string | null | undefined
): SignedRequestPayload | null {
  if (!signedRequest) return null;
  const [encodedSig, encodedPayload] = signedRequest.split(".", 2);
  if (!encodedSig || !encodedPayload) return null;

  let payload: SignedRequestPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
  } catch {
    return null;
  }
  if (payload.algorithm && payload.algorithm.toUpperCase() !== "HMAC-SHA256") {
    return null;
  }

  const signature = base64UrlDecode(encodedSig);
  const secrets = [
    process.env.INSTAGRAM_APP_SECRET,
    process.env.FACEBOOK_APP_SECRET,
  ].filter((s): s is string => Boolean(s));

  const valid = secrets.some((secret) => {
    const expected = createHmac("sha256", secret).update(encodedPayload).digest();
    return expected.length === signature.length && timingSafeEqual(expected, signature);
  });

  return valid ? payload : null;
}

export function createDeletionConfirmationCode(): string {
  return randomBytes(9).toString("base64url");
}
