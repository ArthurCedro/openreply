import type { Metadata } from "next";
import LegalShell from "@/components/legal-shell";

export const metadata: Metadata = {
  title: "Data Deletion - OpenReply",
  description:
    "How OpenReply customers can disconnect Instagram and request account or campaign data deletion.",
};

export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const contactEmail = process.env.LEGAL_CONTACT_EMAIL;
  return (
    <LegalShell
      title="Data Deletion"
      description="Use this page for Meta App Review and customer requests about removing OpenReply account, workspace, Instagram, and campaign data."
      updatedAt="May 24, 2026"
    >
      {code ? (
        <section>
          <h2 className="text-xl font-bold text-white">Deletion Request Received</h2>
          <p className="mt-3">
            Your request was processed and the Instagram connection was removed.
            Confirmation code: <code>{code}</code>
          </p>
        </section>
      ) : null}
      <section>
        <h2 className="text-xl font-bold text-white">Remove From Instagram</h2>
        <p className="mt-3">
          You can also remove the app from Instagram under Settings, Apps and
          websites. Instagram then notifies OpenReply, which deletes the stored
          connection token automatically.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold text-white">Disconnect Instagram</h2>
        <p className="mt-3">
          Sign in, open Settings, and select Disconnect. This removes the stored
          Instagram connection token and stops campaigns from sending private
          replies for that workspace.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">Delete Workspace Data</h2>
        <p className="mt-3">
          To delete workspace, campaign, log, webhook, billing reference, and
          operational diagnostic data, contact support
          {contactEmail ? (
            <>
              {" "}at{" "}
              <a className="underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
            </>
          ) : null}{" "}
          from the email address used to sign in. Include the workspace name and the Instagram username
          connected to the workspace.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white">Verification</h2>
        <p className="mt-3">
          We may ask you to verify control of the email address or connected
          business account before deleting data. Deletion requests are processed
          as quickly as practical unless retention is required for legal,
          billing, fraud prevention, or security reasons.
        </p>
      </section>
    </LegalShell>
  );
}
