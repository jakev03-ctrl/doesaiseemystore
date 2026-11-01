import { ImageResponse } from "next/og";
import { getJSON } from "../../../lib/store";
import { OG_SIZE, stars, logo, background } from "../../../lib/ogStyle";

export const runtime = "nodejs";
export const alt = "AI visibility report from DoesAISeeMyStore";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }) {
  const { id } = await params;
  let report = null;
  if (/^[A-Za-z0-9_-]{4,20}$/.test(id)) {
    try {
      report = await getJSON(`report:${id}`);
    } catch {}
  }

  const score = report?.overall ?? null;
  const colour = score == null ? "#9dbbff" : score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  const name = (report?.shop?.name || "This store").slice(0, 40);

  return new ImageResponse(
    (
      <div style={background}>
        {stars()}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "64px 72px",
          }}
        >
          {logo()}

          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 260,
                height: 260,
                borderRadius: 999,
                border: `14px solid ${colour}`,
                marginRight: 56,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontSize: 96, fontWeight: 800 }}>{score ?? "?"}</span>
                <span style={{ fontSize: 30, color: "#8590b5", marginLeft: 4 }}>/100</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
              <div style={{ display: "flex", fontSize: 28, color: "#9dbbff", textTransform: "uppercase", letterSpacing: 2 }}>
                {name}
              </div>
              <div style={{ display: "flex", fontSize: 72, fontWeight: 700, lineHeight: 1.05, marginTop: 12, letterSpacing: -1 }}>
                {report ? report.label : "AI visibility report"}
              </div>
              {report ? (
                <div style={{ display: "flex", fontSize: 30, color: "#c3cce6", marginTop: 18 }}>
                  {report.visibility > 0
                    ? `Recommended in ${report.visibility}% of AI shopping searches`
                    : "Not recommended in AI shopping searches"}
                </div>
              ) : null}
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 26, color: "#9dbbff" }}>
            Does AI see your store? Check free at doesaiseemystore.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
