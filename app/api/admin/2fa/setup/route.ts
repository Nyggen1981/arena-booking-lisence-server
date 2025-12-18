import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { prisma } from "@/lib/prisma";

// GET: Generer ny TOTP secret og QR-kode for oppsett
export async function GET() {
  const cookieStore = await cookies();
  const pendingAuth = cookieStore.get("pending-2fa-setup");
  
  if (!pendingAuth) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }
  
  const email = pendingAuth.value;
  
  // Finn admin-bruker
  const admin = await prisma.adminUser.findUnique({
    where: { email },
  });
  
  if (!admin) {
    return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });
  }
  
  // Generer ny secret (eller bruk eksisterende hvis ikke verifisert)
  let secret = admin.totpSecret;
  if (!secret || !admin.totpVerified) {
    secret = authenticator.generateSecret();
    
    // Lagre secret (ikke aktivert ennå)
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { 
        totpSecret: secret,
        totpEnabled: false,
        totpVerified: false,
      },
    });
  }
  
  // Generer QR-kode URL
  const serviceName = "SportFlow License Server";
  const otpauth = authenticator.keyuri(email, serviceName, secret);
  
  // Generer QR-kode som data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  
  return NextResponse.json({
    qrCode: qrCodeDataUrl,
    secret: secret, // For manuell inntasting hvis QR ikke fungerer
    email: email,
  });
}

