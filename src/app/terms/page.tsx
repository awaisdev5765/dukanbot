import Link from "next/link";

export const metadata = {
  title: "Terms of Service · DukanBot",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← DukanBot
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/90">
        <p>
          By using DukanBot you agree to these terms. If you do not agree, do not
          use the service.
        </p>
        <h2 className="text-lg font-semibold pt-2">Service</h2>
        <p>
          DukanBot provides WhatsApp order automation and a merchant dashboard.
          Features and limits depend on your plan. We may change plans with
          notice.
        </p>
        <h2 className="text-lg font-semibold pt-2">Your responsibilities</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Comply with Meta WhatsApp Business policies and local law.</li>
          <li>Keep API tokens and account access secure.</li>
          <li>
            Ensure catalog prices, stock, and customer communications are
            accurate.
          </li>
          <li>Obtain any consent required for messaging your customers.</li>
        </ul>
        <h2 className="text-lg font-semibold pt-2">Billing</h2>
        <p>
          Paid plans renew as stated at checkout. Fees are in PKR unless noted.
          No charge for a free trial period if offered.
        </p>
        <h2 className="text-lg font-semibold pt-2">Disclaimer</h2>
        <p>
          The service is provided &quot;as is.&quot; We are not liable for missed
          orders due to Meta outages, misconfigured credentials, or LLM
          misunderstanding beyond reasonable efforts.
        </p>
        <h2 className="text-lg font-semibold pt-2">Contact</h2>
        <p>
          Legal:{" "}
          <a className="text-primary underline" href="mailto:legal@dukanbot.pk">
            legal@dukanbot.pk
          </a>
        </p>
      </div>
    </div>
  );
}
