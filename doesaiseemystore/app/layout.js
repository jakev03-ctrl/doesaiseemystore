import "./globals.css";

export const metadata = {
  title: "Does AI See My Store? | Free AI visibility check",
  description:
    "Find out if ChatGPT-style AI assistants recommend your online store when customers ask what to buy. Free check in about a minute.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
