"use client";

import { useEffect, useState } from "react";
import { reportError, clearSaved, tryRecover } from "./components/recover";

// If anything on a page crashes, recover by itself (clear saved data and reload once),
// and send the details to the admin page so it can be fixed.
export default function Error({ error, reset }) {
  const [trying, setTrying] = useState(true);
  useEffect(() => {
    reportError(error);
    if (!tryRecover()) setTrying(false);
  }, [error]);

  if (trying) return null;
  return (
    <main className="wrap narrow">
      <div className="card cta" style={{ marginTop: "18vh" }}>
        <h3>Sorry, something went wrong</h3>
        <p className="muted">Please reload the page. If it keeps happening, the button below resets this site's saved data in your browser.</p>
        <button
          type="button"
          onClick={() => {
            clearSaved();
            try {
              sessionStorage.removeItem("dasms_recovered");
            } catch {}
            location.reload();
          }}
        >
          Reset and reload
        </button>
      </div>
    </main>
  );
}
