import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Starfield from "./components/Starfield";
import ThemeToggle from "./components/ThemeToggle";

// Sets the saved theme before the page paints, so there's no flash.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else document.documentElement.dataset.theme="dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://www.doesaiseemystore.com"),
  title: "Does AI See My Store? | Free AI visibility check",
  description:
    "When shoppers ask AI assistants what to buy, we check if your shop comes up, show you who gets picked instead, and tell you exactly what to fix. Free check in under 60 seconds.",
  openGraph: {
    title: "Does AI see your store?",
    description: "Find out if AI assistants recommend your online store, or your competitors instead. Free check in under 60 seconds.",
    siteName: "DoesAISeeMyStore",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#040817" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
