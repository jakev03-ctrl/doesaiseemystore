import Footer from "../components/Footer";
import { EXAMPLE_CSS, EXAMPLE_HTML } from "./content";

const OG = { url: "/og.png", width: 1200, height: 630, alt: "Does AI see your store? Free AI visibility check" };

export const metadata = {
  alternates: { canonical: "/example" },
  title: "Example AI visibility report | DoesAISeeMyStore",
  description: "See a full example report: every AI search, who got recommended instead, what AI gets wrong, and the exact steps to fix it.",
  openGraph: { title: "Example AI visibility report", description: "See exactly what you get: every AI search, who AI recommends instead, and what to fix.", url: "/example", siteName: "DoesAISeeMyStore", type: "website", images: [OG] },
};

// A complete example report for a made-up store, so visitors can see what they get before checking.
export default function ExamplePage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: EXAMPLE_CSS }} />
      <main id="main" className="ex" dangerouslySetInnerHTML={{ __html: EXAMPLE_HTML }} />
      <Footer />
    </>
  );
}
