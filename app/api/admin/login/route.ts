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

  // Passord er korrekt - sjekk 2FA status
  // For enkelhets skyld bruker vi én admin-bruker basert på env-passord
  // I en mer avansert løsning ville man ha email-basert login
  
  const { prisma } = await import("@/lib/prisma");
  
  // Finn eller opprett standard admin-bruker
  let admin = await prisma.adminUser.findFirst({
    where: { role: "super" },
  });
  
  if (!admin) {
    // Opprett standard admin-bruker første gang
    admin = await prisma.adminUser.create({
      data: {
        email: "admin@arena-license.local",
        password: "", // Ikke brukt - vi bruker env-passord
        name: "Administrator",
        role: "super",
        totpEnabled: false,
        totpVerified: false,
      },
    });
  }

  // Sjekk om 2FA er aktivert
  if (admin.totpEnabled && admin.totpVerified) {
    // 2FA er aktivert - krever kode
    const response = NextResponse.json({ 
      success: false,
      needs2FA: true,
      message: "Skriv inn kode fra Google Authenticator",
    });
    
    // Sett pending cookie for 2FA validering
    response.cookies.set("pending-2fa-login", admin.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 5, // 5 minutter
    });
    
    return response;
  }
  
  // 2FA er IKKE aktivert - krever oppsett
  const response = NextResponse.json({ 
    success: false,
    needsSetup: true,
    message: "2FA må aktiveres for å sikre kontoen",
  });
  
  // Sett pending cookie for 2FA oppsett
  response.cookies.set("pending-2fa-setup", admin.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutter
  });
  
  return response;
}
