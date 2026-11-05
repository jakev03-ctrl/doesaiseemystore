// Tells Google which pages exist. Visible at /sitemap.xml
const SITE = process.env.SITE_URL || "https://www.doesaiseemystore.com";

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/how-we-test`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/news`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/request`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
