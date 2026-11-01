import { ImageResponse } from "next/og";

// Version 8d: simple share image (no helper functions or lists).
export const alt = "Does AI see your store? Free AI visibility check for online stores.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

export default function Image() {
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
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.05 }}>Does AI see your store?</div>
          <div style={{ display: "flex", fontSize: 34, color: "#c3cce6", marginTop: 24 }}>
            Find out if AI assistants recommend you, or your competitors instead.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#9dbbff" }}>Free check at doesaiseemystore.com</div>
      </div>
    ),
    { ...size }
  );
}
