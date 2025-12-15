import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { password } = body;

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const expected = process.env.LICENSE_ADMIN_PASSWORD ?? "";

  // Debug logging for troubleshooting
  console.log("Login attempt:", {
    hasPassword: !!password,
    passwordLength: password.length,
    hasExpected: expected.length > 0,
    expectedLength: expected.length,
    match: password === expected,
  });

  if (expected.length === 0) {
    console.error("LICENSE_ADMIN_PASSWORD is not set in environment variables!");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (password !== expected) {
    return NextResponse.json({ error: "Feil passord" }, { status: 401 });
  }

  // Set session cookie (simple implementation)
  // In production, you might want to use JWT or a proper session store
  const response = NextResponse.json({ success: true });
  response.cookies.set("admin-auth", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });
  
  return response;

}

