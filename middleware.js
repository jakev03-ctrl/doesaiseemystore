// Maintenance mode is ON by default. To reopen the site: Vercel → Settings → Environment Variables → MAINTENANCE = 0, then redeploy.
// You still get in: visit any page with ?letmein=<your MAINTENANCE_KEY> once, and this browser is let through for 30 days.
import { NextResponse } from "next/server";

export function middleware(req) {
  if (process.env.MAINTENANCE === "0") return NextResponse.next();
  const key = process.env.MAINTENANCE_KEY || "";
  const url = req.nextUrl.clone();

  if (key && url.searchParams.get("letmein") === key) {
    url.searchParams.delete("letmein");
    const res = NextResponse.redirect(url);
    res.cookies.set("dasm_pass", key, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return res;
  }
  if (key && req.cookies.get("dasm_pass")?.value === key) return NextResponse.next();

  if (url.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "We're doing some maintenance. Please check back soon." }, { status: 503 });
  }
  if (url.pathname === "/maintenance") return NextResponse.next();
  url.pathname = "/maintenance";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml).*)"],
};
