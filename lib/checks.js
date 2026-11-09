// The simple "What we checked" facts shown on the report.
export function summariseChecks(c) {
  const f = c.productSchema && typeof c.productSchema === "object" ? c.productSchema : null;
  const label = { reviews: "reviews", image: "images", description: "descriptions", price: "prices", availability: "stock", brand: "brand", identifier: "product codes", shipping: "delivery info", returns: "returns info" };
  const missing = f ? Object.keys(label).filter((k) => f[k] === false).map((k) => label[k]) : [];
  return {
    aiAccess: c.blockedBots.length ? { ok: false, text: `Blocked for ${c.blockedBots.join(", ")}` } : c.blockedProducts.length ? { ok: false, text: `Product pages blocked for ${c.blockedProducts.join(", ")}` } : { ok: true, text: "Open to AI assistants" },
    sitemap: c.sitemap.found ? { ok: true, text: c.sitemap.products ? "Found, lists your products" : "Found" } : { ok: false, text: "Not found" },
    productData:
      c.productSchema === "none" ? { ok: false, text: "Not found on product pages" }
      : c.productSchema === "microdata" ? { ok: true, text: "Found" }
      : f ? { ok: missing.length <= 2, text: missing.length ? `Found, missing ${missing.slice(0, 3).join(", ")}` : "Found, complete" }
      : null,
    policies: { ok: c.policies.returns && c.policies.delivery, text: c.policies.returns && c.policies.delivery ? "Delivery and returns linked" : !c.policies.returns && !c.policies.delivery ? "Delivery and returns not linked from homepage" : !c.policies.returns ? "Returns not linked from homepage" : "Delivery not linked from homepage" },
  };
}

