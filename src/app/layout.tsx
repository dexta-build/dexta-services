import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import "./globals-3d.css";
import { getSiteSettings } from "@/lib/content/site-settings";
import { stock } from "@/lib/site/stock-media";
import { mont, instrumentSerif } from "@/lib/fonts";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site/site-url";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await getSiteSettings();
  const siteUrl = seo.siteUrl || SITE_URL;
  const image = seo.image ? stock(seo.image, 1200, 630) : undefined;
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.siteName || SITE_NAME,
      template: `%s | ${seo.siteName || SITE_NAME}`,
    },
    description: seo.description || SITE_DESCRIPTION,
    applicationName: seo.siteName || SITE_NAME,
    // No site-wide title here: pages without their own preview text fall back
    // to their page <title> instead of all showing the site name.
    openGraph: {
      siteName: seo.siteName || SITE_NAME,
      locale: "en_NG",
      type: "website",
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { business, seo } = await getSiteSettings();
  const siteUrl = seo.siteUrl || SITE_URL;
  const primaryEmail = business.emails[0];
  const primaryPhone = business.phones[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: seo.siteName || SITE_NAME,
    description: seo.description || SITE_DESCRIPTION,
    logo: `${siteUrl}/favicon.ico`,
    image: `${siteUrl}/opengraph-image`,
    address: business.address,
    telephone: primaryPhone,
    email: primaryEmail,
    url: siteUrl,
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
