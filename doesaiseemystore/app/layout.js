import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import Starfield from "./components/Starfield";

export const metadata = {
  title: "Does AI See My Store? | Free AI visibility check",
  description:
    "Find out if AI shopping assistants recommend your online store when customers ask what to buy. Free check in about a minute.",
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
