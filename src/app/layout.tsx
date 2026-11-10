import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "./globals-3d.css";
import { fetchContactPageContent } from "@/lib/api";
import { mont, instrumentSerif } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site/site-url";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // No site-wide title here: pages without their own preview text fall back
  // to their page <title> instead of all showing the site name.
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const contactContent = await fetchContactPageContent();
  const primaryEmail = contactContent.emails[0];
  const primaryPhone = contactContent.phones[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    logo: `${SITE_URL}/favicon.ico`,
    image: `${SITE_URL}/opengraph-image`,
    address: contactContent.address,
    telephone: primaryPhone,
    email: primaryEmail,
    url: SITE_URL,
  };

  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${mont.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
