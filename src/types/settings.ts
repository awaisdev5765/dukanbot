export type PlanId = "starter" | "growth" | "business";

export type TeamMember = {
  id: string;
  email: string;
  role: "owner" | "admin" | "staff";
  status: "pending" | "active";
};

export type NotificationPrefs = {
  new_order: boolean;
  escalation: boolean;
  daily_summary: boolean;
  email: boolean;
  whatsapp: boolean;
};

export type SettingsState = {
  plan: PlanId;
  whatsapp_number: string;
  whatsapp_phone_number_id: string;
  team: TeamMember[];
  notifications: NotificationPrefs;
  notify_email?: string;
  notify_whatsapp_number?: string;
  business_name?: string;
  updated_at: string;
};

export const PLANS: {
  id: PlanId;
  name: string;
  price: string;
  features: string[];
}[] = [
  {
    id: "starter",
    name: "Starter",
    price: "2,999",
    features: ["1 WhatsApp number", "500 bot replies / mo", "Catalog + orders"],
  },
  {
    id: "growth",
    name: "Growth",
    price: "7,999",
    features: [
      "5,000 bot replies / mo",
      "Inbox takeover",
      "JazzCash / Easypaisa",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: "14,999",
    features: ["Team seats", "Courier webhooks", "Dedicated onboarding"],
  },
];
