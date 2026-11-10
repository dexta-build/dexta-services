import type { Metadata } from "next";
import DevDayPage from "@/components/devday";
import { RecaptchaProvider } from "@/components/layout/recaptcha-provider";

export const metadata: Metadata = {
  title: "Dev Day",
  description:
    "Join Dev Day — an online gathering for developers to share ideas, tools, and experiences. Register for free.",
  openGraph: {
    title: "Dev Day by Dexta",
    description:
      "An online space for developers to connect, share what they're building, and talk real experiences. Free to join.",
    url: "https://dextaservices.com/dev-day",
    siteName: "Dexta Synergy Services",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dev Day by Dexta",
    description:
      "Register for Dev Day — a free online gathering for developers.",
  },
};

export default function Page() {
  return (
    <RecaptchaProvider>
      <DevDayPage />
    </RecaptchaProvider>
  );
}
