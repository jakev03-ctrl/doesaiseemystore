// Tells search engines what to look at. Visible at /robots.txt
const SITE = process.env.SITE_URL || "https://www.doesaiseemystore.com";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/report/"] }],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
