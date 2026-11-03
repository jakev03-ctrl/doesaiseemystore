import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Starfield from "./components/Starfield";

export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://www.doesaiseemystore.com"),
  title: "Does AI See My Store? | Free AI visibility check",
  description:
    "Find out if AI shopping assistants recommend your online store when customers ask what to buy. Free check in under 60 seconds.",
  openGraph: {
    title: "Does AI see your store?",
    description: "Find out if AI assistants recommend your online store, or your competitors instead. Free check in under 60 seconds.",
    siteName: "DoesAISeeMyStore",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#040817" };

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>
        <Starfield />
        <div className="page">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
