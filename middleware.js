// Maintenance mode has been removed. This file is kept only so that uploading it replaces the old one.
// It lets every page through, untouched.
import { NextResponse } from "next/server";

export function middleware() {
  return NextResponse.next();
}

export const config = { matcher: ["/__no-maintenance__"] };
