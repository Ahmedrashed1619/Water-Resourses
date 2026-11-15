import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PASSWORD } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  const map: Record<string, string> = {
    SUPER_ADMIN: "SECTOR_SUPER_ADMIN",
    SECTOR: "SECTOR_ADMIN",
    DEPARTMENT: "DEPARTMENT_EMPLOYEE",
  };
  for (const [from, to] of Object.entries(map)) {
    await prisma.user.updateMany({ where: { role: from }, data: { role: to } });
  }
  await prisma.user.updateMany({
    where: { email: "admin@operio.local" },
    data: { nameAr: "مسؤول أعلى للقطاع", nameEn: "Sector super admin", role: "SECTOR_SUPER_ADMIN" },
  });
  await prisma.user.updateMany({
    where: { email: "sector@operio.local" },
    data: { nameAr: "مدير قطاع الري", nameEn: "Sector admin", role: "SECTOR_ADMIN" },
  });
  await prisma.user.updateMany({
    where: { email: "east.minya@operio.local" },
    data: { nameAr: "موظف ري شرق المنيا", nameEn: "East Minya employee", role: "DEPARTMENT_EMPLOYEE" },
  });
  const east = await prisma.department.findUnique({ where: { code: "east-minya" } });
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const extras = [
    { email: "sector.staff@operio.local", nameAr: "موظف قطاع الري", nameEn: "Sector employee", role: "SECTOR_EMPLOYEE", departmentId: null },
    { email: "east.minya.super@operio.local", nameAr: "مسؤول أعلى لري شرق المنيا", nameEn: "East Minya super admin", role: "DEPARTMENT_SUPER_ADMIN", departmentId: east?.id ?? null },
    { email: "east.minya.admin@operio.local", nameAr: "مدير ري شرق المنيا", nameEn: "East Minya admin", role: "DEPARTMENT_ADMIN", departmentId: east?.id ?? null },
  ];
  for (const account of extras) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: { nameAr: account.nameAr, nameEn: account.nameEn, role: account.role, departmentId: account.departmentId },
      create: { ...account, passwordHash: hash },
    });
  }
}

main().finally(() => prisma.$disconnect());
