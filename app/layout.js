import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Starfield from "./components/Starfield";
import ThemeToggle from "./components/ThemeToggle";

// Sets the saved theme before the page paints, so there's no flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else document.documentElement.dataset.theme="dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://www.doesaiseemystore.com"),
  title: "Does AI See My Store? | Free AI visibility check",
  description: "When shoppers ask AI what to buy, does your store come up? See how AI sees your store and the simple changes that help it find you. Free check.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Does AI see your store?",
    description: "Find out if AI assistants recommend your online store, or your competitors instead. Free check in under 2 minutes.",
    url: "/",
    siteName: "DoesAISeeMyStore",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

// Structured data: tells search engines and AI assistants what this site is.
const SITE = process.env.SITE_URL || "https://www.doesaiseemystore.com";
const LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE}/#org`, name: "DoesAISeeMyStore", url: SITE, logo: `${SITE}/logo-512.png`, email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "doesaiseemystore@outlook.com", areaServed: "GB" },
    { "@type": "WebSite", "@id": `${SITE}/#site`, name: "DoesAISeeMyStore", url: SITE, inLanguage: "en-GB", publisher: { "@id": `${SITE}/#org` } },
    {
      "@type": "WebApplication",
      name: "DoesAISeeMyStore AI visibility check",
      url: SITE,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any (web browser)",
      description: "A free check that shows online stores how often AI shopping assistants recommend them, who gets picked instead, and what to change.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
      publisher: { "@id": `${SITE}/#org` },
    },
  ],
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#040817" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD).replace(/</g, "\\u003c") }} />
      </head>
      <body>
        <Starfield />
        <ThemeToggle />
        <div className="page">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
