import Footer from "../../components/Footer";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { OWNER_COOKIE, isOwner } from "../../../lib/limits";
import { getJSON } from "../../../lib/store";
import Report from "../../components/Report";
import { publicView } from "../../../lib/report";

export const dynamic = "force-dynamic";

async function load(id, full = false) {
  if (!/^[A-Za-z0-9_-]{4,20}$/.test(id)) return null;
  const report = await getJSON(`report:${id}`);
  return report ? publicView(report, { full }) : null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const report = await load(id);
  if (!report) return { title: "Report not found | DoesAISeeMyStore" };
  return {
    title: `${report.shop.name} scored ${report.overall}/100 | DoesAISeeMyStore`,
    description: `Does AI recommend ${report.shop.name}? See the full AI visibility report, then check your own store free.`,
    openGraph: {
      title: `${report.shop.name} scored ${report.overall}/100 for AI visibility`,
      description: "Does AI see your store? Check yours free in under 60 seconds.",
      type: "article",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: ["/og.png"] },
  };
}

export default async function ReportPage({ params, searchParams }) {
  const { id } = await params;
  const sp = (await searchParams) || {};
  const jar = await cookies();
  const owner = isOwner(jar.get(OWNER_COOKIE)?.value);
  // A private link we send a client (…?access=…) shows their report in full.
  const access = String(sp.access || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  const client = !owner && access ? (await getJSON(`share:${access}`).catch(() => null)) === id : false;
  const report = await load(id, owner || client);
  if (!report) notFound();

  return (
    <main className="wrap">
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
        <nav className="topnav" aria-label="Main">
          <a href="/news">News</a>
        </nav>
      </header>

      <Report report={report} shared clientView={client} />

      <div className="card cta">
        <h3>Does AI see your store?</h3>
        <p className="muted">Run a free check on your own shop in under 60 seconds.</p>
        <a className="button" href="/">
          Check my store
        </a>
      </div>

      <Footer />
    </main>
  );
}
