// Reads a shop's website and pulls out the useful product information.

const UA =
  "Mozilla/5.0 (compatible; DoesAISeeMyStore/1.0; +https://doesaiseemystore.com)";

// Turn whatever the person typed into a clean web address.
export function normaliseUrl(input) {
  let raw = String(input || "").trim();
  if (!raw) throw new Error("Please enter your store's web address.");
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("That doesn't look like a web address. Try something like mystore.com");
  }

  const host = url.hostname.toLowerCase();
  // Basic safety: only real public websites, not internal addresses.
  const isIp = /^[\d.]+$/.test(host) || host.includes(":");
  if (isIp || host === "localhost" || !host.includes(".") || host.endsWith(".local") || host.endsWith(".internal")) {
    throw new Error("Please enter a public store website address.");
  }

  const domain = host.replace(/^www\./, "");
  return { origin: `https://${host}`, domain };
}

async function get(url, timeoutMs = 10000) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
  });
  return res;
}

function stripHtml(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function pick(html, regex) {
  const m = html.match(regex);
  return m ? stripHtml(m[1]) : "";
}

// Work out the shop's name from its homepage.
function shopNameFrom(html, domain) {
  const site = pick(html, /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);
  if (site) return site;
  const title = pick(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) {
    const parts = title.split(/\s[|–—-]\s/).map((s) => s.trim()).filter(Boolean);
    // Shop name is usually the last or shortest part of the title.
    const best = parts.sort((a, b) => a.length - b.length)[0];
    if (best && best.length <= 40) return best;
  }
  return domain.split(".")[0];
}

export async function readShop(input) {
  const { origin, domain } = normaliseUrl(input);

  // 1. Homepage (for the name, and as a backup if there's no product list).
  let homeHtml = "";
  let finalDomain = domain;
  try {
    const res = await get(origin);
    if (res.ok) {
      homeHtml = await res.text();
      try {
        finalDomain = new URL(res.url).hostname.replace(/^www\./, "");
      } catch {}
    }
  } catch {
    // ignore here; we'll report below if nothing worked
  }

  // 2. Shopify product list (works for most Shopify shops).
  let products = [];
  try {
    const res = await get(`${origin}/products.json?limit=50`);
    if (res.ok && (res.headers.get("content-type") || "").includes("json")) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        products = data.products.map((p) => ({
          title: p.title,
          type: p.product_type || "",
          tags: Array.isArray(p.tags) ? p.tags.slice(0, 15) : String(p.tags || "").split(",").slice(0, 15),
          price: p.variants?.[0]?.price || "",
          options: (p.options || []).map((o) => `${o.name}: ${(o.values || []).slice(0, 8).join(", ")}`),
          description: stripHtml(p.body_html).slice(0, 1200),
        }));
      }
    }
  } catch {
    // not a Shopify shop, or blocked: fine, we'll use the homepage text
  }

  if (!homeHtml && products.length === 0) {
    throw new Error(
      "We couldn't open that website. Check the address is right and the site is public, then try again."
    );
  }

  const shopName = shopNameFrom(homeHtml, finalDomain);
  const pageText = stripHtml(homeHtml).slice(0, 6000);
  const hasStructuredData = /application\/ld\+json/i.test(homeHtml);

  return {
    origin,
    domain: finalDomain,
    shopName,
    products,
    pageText,
    hasStructuredData,
    isShopify: products.length > 0,
  };
}
