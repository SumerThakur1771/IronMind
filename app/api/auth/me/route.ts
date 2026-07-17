import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@/app/lib/auth";

// Returns the current user derived from the (HttpOnly) auth cookie.
// The client can't read the cookie directly, so it asks the server.
export async function GET(request: NextRequest) {
  const auth = getAuth(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ email: auth.email, role: auth.role });
}
