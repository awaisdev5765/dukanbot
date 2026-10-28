import Link from "next/link";
import {
  ClipboardList,
  MessagesSquare,
  Sparkles,
  Store,
  Tags,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WhatsAppMockup } from "@/components/landing/whatsapp-mockup";
import { FaqList } from "@/components/landing/faq-list";
import { ThemeToggle } from "@/components/landing/theme-toggle";

const STEPS = [
  {
    icon: MessagesSquare,
    title: "Connect WhatsApp",
    body: "Link your Business number once. Catalog and hours sync into the bot.",
  },
  {
    icon: Sparkles,
    title: "Bot takes the order",
    body: "English, Urdu, or Roman Urdu. COD, JazzCash, or Easypaisa — confirmed in chat.",
  },
  {
    icon: ClipboardList,
    title: "You dispatch",
    body: "Orders land on your desk ready for Leopards or TCS, with tracking.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "2,999",
    blurb: "Solo shops testing automation",
    features: ["1 WhatsApp number", "500 bot replies / mo", "Catalog + orders"],
    cta: "Start free trial",
    featured: false,
  },
  {
    name: "Growth",
    price: "7,999",
    blurb: "Busy boutiques & restaurants",
    features: [
      "5,000 bot replies / mo",
      "Inbox takeover",
      "JazzCash / Easypaisa flows",
    ],
    cta: "Choose Growth",
    featured: true,
  },
  {
    name: "Business",
    price: "14,999",
    blurb: "Multi-staff clinics & chains",
    features: ["Team seats", "Courier webhooks", "Dedicated onboarding"],
    cta: "Talk to us",
    featured: false,
  },
];

const QUOTES = [
  {
    quote:
      "Raat ke 1 baje order aaya — subah tracking ready thi. Pehle woh message miss ho jata tha.",
    name: "Ayesha Khan",
    role: "Noor Boutique, Lahore",
  },
  {
    quote:
      "Roman Urdu mein baat karta hai jaise mera counter staff. COD confirm khud ho jata hai.",
    name: "Bilal Ahmed",
    role: "Spice House, Karachi",
  },
  {
    quote:
      "Appointment pehle WhatsApp pe gum ho jati thin. Ab bot slot lock karta hai, main treat karti hoon.",
    name: "Dr. Sara Malik",
    role: "Clinic, Islamabad",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Store className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">
              DukanBot
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground transition-colors">
              How it works
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="landing-mesh border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div className="landing-reveal space-y-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              For Pakistani shops
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
              Your shop answers WhatsApp — even when you don&apos;t.
            </h1>
            <p className="max-w-md text-[16px] leading-relaxed text-muted-foreground">
              Takes orders in English, Urdu & Roman Urdu. Confirms COD or
              JazzCash/Easypaisa. Queues Leopards/TCS — without you typing.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="lg">
                <Link href="/signup">Start free trial</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#how">See how it works</a>
              </Button>
            </div>
          </div>
          <div className="landing-reveal lg:justify-self-end" style={{ animationDelay: "120ms" }}>
            <WhatsAppMockup />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            You&apos;re losing after-hours orders
          </h2>
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            Customers message late — price, size, COD. Reply in the morning and
            half have already ordered elsewhere.
          </p>
        </div>
        <div className="mt-12 grid gap-0 border-t border-border sm:grid-cols-3">
          {[
            { title: "Unread at midnight", body: "Boutique inquiries pile up while you sleep." },
            { title: "Same questions daily", body: "Hours, delivery, returns — typed again." },
            { title: "Orders lost in DMs", body: "Addresses and sizes buried in chat threads." },
          ].map((item) => (
            <div key={item.title} className="border-b border-border py-7 sm:border-b-0 sm:border-r sm:px-6 sm:py-8 last:sm:border-r-0 first:sm:pl-0">
              <h3 className="text-[15px] font-semibold tracking-[-0.02em]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            How it works
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="space-y-3">
                <step.icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Step 0{i + 1}
                </p>
                <h3 className="text-lg font-semibold tracking-[-0.02em]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-xl space-y-3">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Simple PKR pricing
          </h2>
          <p className="text-[16px] text-muted-foreground">Built for Pakistani shops.</p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col bg-card p-6 sm:p-8 ${plan.featured ? "ring-1 ring-inset ring-primary" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold tracking-[-0.02em]">{plan.name}</h3>
                {plan.featured && (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">Rs.</span>
                <span className="text-4xl font-semibold tracking-[-0.04em]">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted-foreground">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Tags className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={1.75} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="mt-8 w-full"
                variant={plan.featured ? "default" : "outline"}
              >
                <Link href="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Shops that stopped missing chats
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {QUOTES.map((t) => (
              <blockquote key={t.name} className="space-y-4 border-t border-border pt-6">
                <p className="leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</p>
                <footer>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">FAQ</h2>
        <div className="mt-10">
          <FaqList />
        </div>
      </section>

      <section className="border-t border-border bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-center md:py-20">
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Open for orders tonight.
            </h2>
            <p className="max-w-md text-sidebar-muted">
              Set up in minutes. Your next WhatsApp customer gets a reply — even
              if you&apos;re closed.
            </p>
          </div>
          <Button asChild size="lg" className="bg-sidebar-accent hover:bg-sidebar-accent/90">
            <Link href="/signup">Create your DukanBot</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <p>
            <span className="font-medium text-foreground">DukanBot</span> · Built
            for Pakistani small business
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
