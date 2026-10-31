import { notFound } from "next/navigation";
import { getJSON } from "../../../lib/store";
import Report from "../../components/Report";

export const dynamic = "force-dynamic";

async function load(id) {
  if (!/^[A-Za-z0-9_-]{4,20}$/.test(id)) return null;
  return getJSON(`report:${id}`);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const report = await load(id);
  if (!report) return { title: "Report not found | DoesAISeeMyStore" };
  return {
    title: `${report.shop.name} scored ${report.overall}/100 | DoesAISeeMyStore`,
    description: `Does AI recommend ${report.shop.name}? See the full AI visibility report, then check your own store free.`,
  };
}

export default async function ReportPage({ params }) {
  const { id } = await params;
  const report = await load(id);
  if (!report) notFound();

  return (
    <main>
      <header className="top">
        <a href="/" className="logo">
          DoesAI<b>See</b>MyStore
        </a>
      </header>

      <Report report={report} shared />

      <div className="card cta">
        <h3>Does AI see your store?</h3>
        <p className="muted">Run a free check on your own shop in about a minute.</p>
        <a className="button" href="/">
          Check my store
        </a>
      </div>

      <footer>
        © {new Date().getFullYear()} DoesAISeeMyStore · <a href="/privacy">Privacy</a>
      </footer>
    </main>
  );
}
