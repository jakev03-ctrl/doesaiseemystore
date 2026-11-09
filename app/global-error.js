"use client";

import { useEffect } from "react";
import { reportError, clearSaved, tryRecover } from "./components/recover";

// Last line of defence if the whole page fails to load.
export default function GlobalError({ error }) {
  useEffect(() => {
    reportError(error);
    tryRecover();
  }, [error]);
  return (
    <html lang="en-GB">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#040817", color: "#fff", fontFamily: "-apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h2>Sorry, something went wrong</h2>
          <p style={{ color: "#bac4e0" }}>Please reload the page.</p>
          <button
            type="button"
            onClick={() => {
              clearSaved();
              try {
                sessionStorage.removeItem("dasms_recovered");
              } catch {}
              location.reload();
            }}
            style={{ font: "inherit", fontWeight: 700, padding: "12px 22px", border: 0, borderRadius: 12, background: "#6e9bff", color: "#fff", cursor: "pointer" }}
          >
            Reset and reload
          </button>
        </div>
      </body>
    </html>
  );
}
