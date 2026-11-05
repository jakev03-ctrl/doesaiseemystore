// Emails you when several checks fail in a row (e.g. the AI credit ran out), at most every 6 hours.
import { getJSON, increment, setJSON } from "./store";
import { notifyOwner } from "./notify";

export async function alertOnFailures(message = "") {
  const n = await increment("alerts:fails:30m", 30 * 60);
  const credit = /credit|billing|balance|quota/i.test(message);
  if (n < 3 && !credit) return;
  if (await getJSON("alerts:sent")) return;
  await setJSON("alerts:sent", 1, 6 * 60 * 60);
  await notifyOwner({
    type: "alert",
    subject: credit ? "Action needed: your AI credit has run out" : `Heads up: ${n} checks failed in the last 30 minutes`,
    message: credit
      ? "Checks are failing because the Anthropic account is out of credit. Top up at console.anthropic.com, then run a test check."
      : `Latest error: ${String(message).slice(0, 300)}\n\nOpen your admin page (System health) to see more.`,
  });
}
