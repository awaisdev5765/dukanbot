import {
  ClipboardList,
  House,
  MessagesSquare,
  Phone,
  Settings2,
  Sparkles,
  Tags,
} from "lucide-react";

/** Primary nav for shop owners — short labels, one job each. */
export const DASHBOARD_NAV: {
  href: string;
  label: string;
  hint: string;
  icon: typeof House;
  exact?: boolean;
}[] = [
  {
    href: "/dashboard",
    label: "Home",
    hint: "What to do next",
    icon: House,
    exact: true,
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    hint: "Confirm & dispatch",
    icon: ClipboardList,
  },
  {
    href: "/dashboard/conversations",
    label: "Chats",
    hint: "Reply to customers",
    icon: MessagesSquare,
  },
  {
    href: "/dashboard/catalog",
    label: "Products",
    hint: "What you sell",
    icon: Tags,
  },
  {
    href: "/dashboard/bot",
    label: "Bot",
    hint: "Welcome & FAQs",
    icon: Sparkles,
  },
  {
    href: "/dashboard/connect-whatsapp",
    label: "WhatsApp",
    hint: "Connect your number",
    icon: Phone,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    hint: "Team & alerts",
    icon: Settings2,
  },
];
