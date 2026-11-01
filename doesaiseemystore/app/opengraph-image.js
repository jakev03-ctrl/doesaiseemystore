import { ImageResponse } from "next/og";
import { OG_SIZE, stars, logo, background } from "../lib/ogStyle";

export const alt = "Does AI see your store? Free AI visibility check for online stores.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
              Does AI see your store?
            </div>
            <div style={{ display: "flex", fontSize: 34, color: "#c3cce6", marginTop: 24, maxWidth: 900 }}>
              Find out if AI assistants recommend you, or your competitors instead.
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#9dbbff" }}>
            Free check · doesaiseemystore.com
          </div>
        </div>
      </div>
    ),
    size
  );
}
