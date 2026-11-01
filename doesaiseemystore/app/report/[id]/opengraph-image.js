import { ImageResponse } from "next/og";
import { getJSON } from "../../../lib/store";

// Version 8d: simple share image (no helper functions or lists).
export const runtime = "nodejs";
export const alt = "AI visibility report from DoesAISeeMyStore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default async function Image({ params }) {
  const { id } = await params;
  let report = null;
  if (/^[A-Za-z0-9_-]{4,20}$/.test(String(id))) {
    try {
      report = await getJSON(`report:${id}`);
    } catch {}
  }

  const score = report && typeof report.overall === "number" ? String(report.overall) : "?";
  const n = report ? report.overall : 0;
  const colour = !report ? "#9dbbff" : n >= 70 ? "#34d399" : n >= 40 ? "#fbbf24" : "#f87171";
  const name = String((report && report.shop && report.shop.name) || "This store").slice(0, 40);
  const label = String((report && report.label) || "AI visibility report");
  const line = !report
    ? "Check your own store free"
    : report.visibility > 0
      ? `Recommended in ${report.visibility}% of AI shopping searches`
      : "Not recommended in AI shopping searches";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#040817",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#9dbbff" }}>DoesAISeeMyStore</div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 240,
              height: 240,
              borderRadius: 120,
              border: `14px solid ${colour}`,
              marginRight: 56,
              fontSize: 96,
              fontWeight: 700,
            }}
          >
            {score}
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <div style={{ display: "flex", fontSize: 28, color: "#9dbbff" }}>{name}</div>
            <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.05, marginTop: 12 }}>{label}</div>
            <div style={{ display: "flex", fontSize: 30, color: "#c3cce6", marginTop: 18 }}>{line}</div>
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#9dbbff" }}>Does AI see your store? Check free at doesaiseemystore.com</div>
      </div>
    ),
    { ...size }
  );
}
