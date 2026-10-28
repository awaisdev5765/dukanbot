import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · DukanBot",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        ← DukanBot
      </Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: August 2026</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-foreground/90">
        <p>
          DukanBot (&quot;we&quot;) helps Pakistani merchants take WhatsApp orders.
          This policy explains what we collect and why.
        </p>
        <h2 className="text-lg font-semibold pt-2">What we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Merchant account data: email, business name, plan.</li>
          <li>
            WhatsApp credentials you connect (tokens, phone number IDs) stored
            encrypted at rest in our database.
          </li>
          <li>
            Customer messages, orders, and catalog data you process through the
            product — on behalf of your shop.
          </li>
          <li>Usage logs needed to operate and secure the service.</li>
        </ul>
        <h2 className="text-lg font-semibold pt-2">How we use it</h2>
        <p>
          To run the bot, show your dashboard, bill your plan, and improve
          reliability. We do not sell customer chat data.
        </p>
        <h2 className="text-lg font-semibold pt-2">Processors</h2>
        <p>
          We use Supabase (auth/database), Meta WhatsApp Cloud API, and OpenAI
          (message understanding). Their policies apply to data they process.
        </p>
        <h2 className="text-lg font-semibold pt-2">Contact</h2>
        <p>
          Privacy questions:{" "}
          <a className="text-primary underline" href="mailto:privacy@dukanbot.pk">
            privacy@dukanbot.pk
          </a>
        </p>
      </div>
    </div>
  );
}
