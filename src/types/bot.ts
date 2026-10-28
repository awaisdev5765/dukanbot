export type BotLanguage = "en" | "ur" | "roman_ur";

export type FaqPair = {
  id: string;
  question: string;
  answer: string;
};

export type BotConfig = {
  business_name: string;
  welcome_message: string;
  languages: BotLanguage[];
  faqs: FaqPair[];
  escalation_threshold: number;
  notify_whatsapp: boolean;
  updated_at: string;
};

export const LANGUAGE_LABELS: Record<BotLanguage, string> = {
  en: "English",
  ur: "Urdu",
  roman_ur: "Roman Urdu",
};

export const DEFAULT_FAQS: FaqPair[] = [
  {
    id: "faq-hours",
    question: "Business hours",
    answer: "We are open Mon–Sat, 10am–9pm. Closed on Sundays.",
  },
  {
    id: "faq-delivery",
    question: "Delivery charges",
    answer: "Delivery is Rs. 200 in city. Free on orders above Rs. 2,000.",
  },
  {
    id: "faq-returns",
    question: "Return policy",
    answer: "Returns accepted within 7 days if unused, with tags attached.",
  },
];
