import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import { prisma } from "@/lib/prisma";

// POST: Valider TOTP-kode ved innlogging (når 2FA allerede er aktivert)
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const pendingAuth = cookieStore.get("pending-2fa-login");
  
  if (!pendingAuth) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }
  
  const email = pendingAuth.value;
  
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }
  
  const { code } = body;
  
  if (!code || typeof code !== "string" || code.length !== 6) {
    return NextResponse.json({ error: "Kode må være 6 siffer" }, { status: 400 });
  }
  
  // Finn admin-bruker
  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });
  
  if (!admin || !admin.totpSecret || !admin.totpEnabled) {
    return NextResponse.json({ error: "2FA ikke aktivert" }, { status: 400 });
  }
  
  // Verifiser koden
  const isValid = authenticator.verify({
    token: code,
    secret: admin.totpSecret,
  });
  
  if (!isValid) {
    return NextResponse.json({ error: "Feil kode" }, { status: 401 });
  }
  
  // Oppdater siste innlogging
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });
  
  // Sett fullstendig autentiserings-cookie
  const response = NextResponse.json({ 
    success: true,
  });
  
  response.cookies.set("admin-auth", "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 timer
  });
  
  // Fjern pending-cookie
  response.cookies.delete("pending-2fa-login");
  
  return response;
}

