import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { getBaseUrl } from "@/lib/env";
import {
  createDeletionConfirmationCode,
  parseSignedRequest,
} from "@/lib/meta/signed-request";

async function readSignedRequest(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const value = form?.get("signed_request");
  return parseSignedRequest(typeof value === "string" ? value : null);
}

/**
 * Removes every stored connection for the Instagram user, the same effect as
 * Disconnect in Settings. Campaigns and logs tied to the connection cascade.
 */
async function removeInstagramUser(userId: string, reason: string) {
  const { count } = await prisma.instagramAccount.deleteMany({
    where: { instagramId: userId },
  });
  await prisma.operationalEvent
    .create({
      data: {
        source: "SYSTEM",
        level: "INFO",
        message: `Meta ${reason} callback removed ${count} Instagram connection(s)`,
        payload: { removed: count },
      },
    })
    .catch(() => {});
}

export async function handleDeauthorize(request: NextRequest) {
  const payload = await readSignedRequest(request);
  if (!payload?.user_id) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }
  await removeInstagramUser(String(payload.user_id), "deauthorize");
  return NextResponse.json({ success: true });
}

export async function handleDataDeletion(request: NextRequest) {
  const payload = await readSignedRequest(request);
  if (!payload?.user_id) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }
  await removeInstagramUser(String(payload.user_id), "data deletion");
  const confirmationCode = createDeletionConfirmationCode();
  return NextResponse.json({
    url: `${getBaseUrl()}/data-deletion?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
