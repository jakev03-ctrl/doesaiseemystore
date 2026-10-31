// Your private owner link: visit /api/owner?key=YOUR_ADMIN_KEY once on each of
// your devices to get the owner allowance. Visit /api/owner?logout=1 to undo.
import { NextResponse } from "next/server";
import { OWNER_COOKIE, hash } from "../../../lib/limits";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams, origin } = new URL(req.url);
  const res = NextResponse.redirect(new URL("/", origin));

  if (searchParams.get("logout")) {
    res.cookies.delete(OWNER_COOKIE);
    return res;
  }

  const key = searchParams.get("key");
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    return new NextResponse("Not found", { status: 404 });
  }

  res.cookies.set(OWNER_COOKIE, hash(key), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
