import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@sportflow-booking.no";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  console.log("Seeding database...");

  // Opprett admin-bruker
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      name: "Super Admin",
      role: "super"
    }
  });

  console.log("✅ Admin user created:", admin.email);

  // Opprett en test-organisasjon
  const testOrg = await prisma.organization.upsert({
    where: { slug: "test-klubb" },
    update: {},
    create: {
      name: "Test Klubb",
      slug: "test-klubb",
      contactEmail: "test@example.com",
      licenseType: "free",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dager
    }
  });

  console.log("✅ Test organization created:");
  console.log("   Name:", testOrg.name);
  console.log("   License Key:", testOrg.licenseKey);
  console.log("   Expires:", testOrg.expiresAt.toISOString());

  // Opprett Haugesund IL som eksempel
  const haugesundOrg = await prisma.organization.upsert({
    where: { slug: "haugesund-il" },
    update: {},
    create: {
      name: "Haugesund IL",
      slug: "haugesund-il",
      contactEmail: "post@haugesundil.no",
      contactName: "Admin Haugesund",
      licenseType: "standard",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 år
    }
  });

  console.log("✅ Haugesund IL created:");
  console.log("   Name:", haugesundOrg.name);
  console.log("   License Key:", haugesundOrg.licenseKey);
  console.log("   Expires:", haugesundOrg.expiresAt.toISOString());

  // Opprett moduler
  const bookingModule = await prisma.module.upsert({
    where: { key: "booking" },
    update: {},
    create: {
      key: "booking",
      name: "Booking",
      description: "Grunnleggende booking-funksjonalitet",
      isStandard: true,
      isActive: true,
      price: null // Inkludert i base-prisen
    }
  });

  console.log("✅ Booking module created:", bookingModule.name);

  const pricingModule = await prisma.module.upsert({
    where: { key: "pricing" },
    update: {},
    create: {
      key: "pricing",
      name: "Pris & Betaling",
      description: "Pris og betalingshåndtering for bookingene",
      isStandard: false,
      isActive: true,
      price: 99 // kr/mnd ekstra
    }
  });

  console.log("✅ Pricing module created:", pricingModule.name);

  // Aktiver booking-modul for test-organisasjonen (standard modul)
  await prisma.organizationModule.upsert({
    where: {
      organizationId_moduleId: {
        organizationId: testOrg.id,
        moduleId: bookingModule.id
      }
    },
    update: {},
    create: {
      organizationId: testOrg.id,
      moduleId: bookingModule.id,
      isActive: true
    }
  });

  // Aktiver booking-modul for Haugesund IL
  await prisma.organizationModule.upsert({
    where: {
      organizationId_moduleId: {
        organizationId: haugesundOrg.id,
        moduleId: bookingModule.id
      }
    },
    update: {},
    create: {
      organizationId: haugesundOrg.id,
      moduleId: bookingModule.id,
      isActive: true
    }
  });

  console.log("✅ Modules activated for organizations");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




