import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_STAGES, DEMO_PASSWORD, DEPARTMENTS, OPERATION_TYPES } from "../src/lib/catalog";
import { addDays, addMonths, dateToIso, diffDays, parseISODate, todayISO } from "../src/lib/dates";
import { computeStageWindows, evaluateAlertTypes } from "../src/lib/rules";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.stageDateChange.deleteMany();
  await prisma.departmentStageProgress.deleteMany();
  await prisma.financialAdjustment.deleteMany();
  await prisma.operationDepartment.deleteMany();
  await prisma.operation.deleteMany();
  await prisma.stageDefinition.deleteMany();
  await prisma.operationType.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.sector.deleteMany();

  const hash = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const sector = await prisma.sector.create({
    data: { code: "IRRIGATION", nameAr: "قطاع الري", nameEn: "Irrigation Sector" },
  });
  const departmentIds = new Map<string, string>();
  for (let index = 0; index < DEPARTMENTS.length; index += 1) {
    const [code, nameAr, nameEn] = DEPARTMENTS[index];
    const department = await prisma.department.create({
      data: { sectorId: sector.id, code, nameAr, nameEn, sortOrder: index + 1 },
    });
    departmentIds.set(code, department.id);
  }

  await prisma.user.create({
    data: { email: "admin@operio.local", passwordHash: hash, nameAr: "مسؤول أعلى للقطاع", nameEn: "Sector super admin", role: "SECTOR_SUPER_ADMIN" },
  });
  const sectorUser = await prisma.user.create({
    data: { email: "sector@operio.local", passwordHash: hash, nameAr: "مدير قطاع الري", nameEn: "Sector admin", role: "SECTOR_ADMIN" },
  });
  await prisma.user.create({
    data: { email: "sector.staff@operio.local", passwordHash: hash, nameAr: "موظف قطاع الري", nameEn: "Sector employee", role: "SECTOR_EMPLOYEE" },
  });
  const eastId = departmentIds.get("east-minya");
  await prisma.user.create({
    data: { email: "east.minya.super@operio.local", passwordHash: hash, nameAr: "مسؤول أعلى لري شرق المنيا", nameEn: "East Minya super admin", role: "DEPARTMENT_SUPER_ADMIN", departmentId: eastId },
  });
  await prisma.user.create({
    data: { email: "east.minya.admin@operio.local", passwordHash: hash, nameAr: "مدير ري شرق المنيا", nameEn: "East Minya admin", role: "DEPARTMENT_ADMIN", departmentId: eastId },
  });
  const eastUser = await prisma.user.create({
    data: {
      email: "east.minya@operio.local",
      passwordHash: hash,
      nameAr: "موظف ري شرق المنيا",
      nameEn: "East Minya employee",
      role: "DEPARTMENT_EMPLOYEE",
      departmentId: eastId,
    },
  });
  await prisma.user.createMany({
    data: [
      ["asyut", "asyut@operio.local", "موظف ري أسيوط", "Asyut employee"],
      ["damietta", "damietta@operio.local", "موظف ري دمياط", "Damietta employee"],
      ["beheira", "beheira@operio.local", "موظف ري البحيرة", "Beheira employee"],
    ].map(([code, email, nameAr, nameEn]) => ({
      email,
      passwordHash: hash,
      nameAr,
      nameEn,
      role: "DEPARTMENT_EMPLOYEE",
      departmentId: departmentIds.get(code),
    })),
  });

  const types = new Map<string, { id: string; stages: typeof DEFAULT_STAGES & { id: string }[] }>();
  for (const [code, nameAr, nameEn, sortOrder] of OPERATION_TYPES) {
    const type = await prisma.operationType.create({
      data: {
        code,
        nameAr,
        nameEn,
        sortOrder,
        isSystem: true,
        stages: { create: DEFAULT_STAGES.map((stage) => ({ ...stage })) },
      },
      include: { stages: { orderBy: { sortOrder: "asc" } } },
    });
    types.set(code, type as never);
  }

  async function makeOperation(options: {
    type: string;
    nameAr: string;
    nameEn: string;
    approval: string;
    rows: {
      code: string;
      amount: string;
      end?: string;
      modifiedEnd?: string;
      complete?: string[];
      current?: string;
      adjustments?: { delta: string; date: string; reason?: string }[];
    }[];
  }) {
    const type = types.get(options.type);
    if (!type) throw new Error(options.type);
    const operation = await prisma.operation.create({
      data: {
        nameAr: options.nameAr,
        nameEn: options.nameEn,
        operationTypeId: type.id,
        technicalApprovalDate: parseISODate(options.approval),
        createdById: sectorUser.id,
      },
    });
    const windows = computeStageWindows(options.approval, type.stages);
    for (const row of options.rows) {
      const assignment = await prisma.operationDepartment.create({
        data: {
          operationId: operation.id,
          departmentId: departmentIds.get(row.code)!,
          approvedAmount: row.amount,
          approvalStart: parseISODate(options.approval),
          approvalEnd: row.end ? parseISODate(row.end) : null,
          modifiedEnd: row.modifiedEnd ? parseISODate(row.modifiedEnd) : null,
        },
      });
      for (const stage of type.stages) {
        const window = windows.find((item) => item.code === stage.code);
        if (!window) continue;
        const completed = row.complete?.includes(stage.code) ?? false;
        await prisma.departmentStageProgress.create({
          data: {
            operationDepartmentId: assignment.id,
            stageDefinitionId: stage.id,
            baselineStart: parseISODate(window.start),
            baselineDue: parseISODate(window.due),
            plannedStart: parseISODate(window.start),
            plannedDue: parseISODate(window.due),
            isCurrent: row.current ? row.current === stage.code : stage.sortOrder === 1 && !completed,
            actualStart: completed || row.current === stage.code ? parseISODate(window.start) : null,
            completedAt: completed ? parseISODate(window.due) : null,
          },
        });
      }
      for (const adjustment of row.adjustments ?? []) {
        await prisma.financialAdjustment.create({
          data: {
            operationDepartmentId: assignment.id,
            deltaAmount: adjustment.delta,
            effectiveDate: parseISODate(adjustment.date),
            reason: adjustment.reason ?? null,
            createdById: sectorUser.id,
          },
        });
      }
    }
  }

  await makeOperation({
    type: "EFFICIENCY",
    nameAr: "تأهيل وتدعيم البوابات والمنشآت المائية بالإدارة العامة لري شرق المنيا",
    nameEn: "Rehabilitation and strengthening of gates and water structures — East Minya",
    approval: "2026-10-08",
    rows: [{
      code: "east-minya",
      amount: "4750000.00",
      end: "2026-12-30",
      modifiedEnd: "2027-01-15",
      current: "PUBLICATION",
      adjustments: [{ delta: "250000.00", date: "2026-10-20", reason: "تعديل قيمة الأعمال بعد المعاينة الميدانية للبوابات" }],
    }],
  });

  const technical = await prisma.departmentStageProgress.findFirst({
    where: {
      stageDefinition: { code: "TECHNICAL_OPENING" },
      operationDepartment: { department: { code: "east-minya" }, operation: { nameAr: { contains: "البوابات" } } },
    },
  });
  if (technical) {
    await prisma.departmentStageProgress.update({ where: { id: technical.id }, data: { plannedDue: parseISODate("2026-12-13") } });
    await prisma.stageDateChange.create({
      data: {
        progressId: technical.id,
        field: "DUE",
        oldDate: parseISODate("2026-12-08"),
        newDate: parseISODate("2026-12-13"),
        reason: "تعذر انعقاد اللجنة في الموعد لارتباط أعضاء اللجنة بأعمال محافظة مجاورة",
        createdById: eastUser.id,
      },
    });
  }

  await makeOperation({
    type: "DREDGING",
    nameAr: "تطهير الترع الرئيسية — الموسم الشتوي 2026",
    nameEn: "Main canal dredging — winter season 2026",
    approval: "2026-09-01",
    rows: [
      { code: "aswan", amount: "1200000.00", end: "2026-11-23", complete: ["PUBLICATION", "TECHNICAL_OPENING"], current: "FINANCIAL_OPENING" },
      { code: "sohag", amount: "980000.00", end: "2026-11-23", complete: ["PUBLICATION", "TECHNICAL_OPENING"], current: "FINANCIAL_OPENING" },
      { code: "asyut", amount: "1100000.00", end: "2026-11-23", complete: ["PUBLICATION"], current: "TECHNICAL_OPENING" },
      {
        code: "giza",
        amount: "1500000.00",
        end: "2026-11-23",
        complete: ["PUBLICATION", "TECHNICAL_OPENING"],
        current: "FINANCIAL_OPENING",
        adjustments: [{ delta: "-50000.00", date: "2026-09-18", reason: "استبعاد مقطع تم تنفيذه في عملية سابقة" }],
      },
    ],
  });

  const today = todayISO();
  const soonApproval = addMonths(addDays(today, 4), -1);
  await makeOperation({
    type: "INVESTMENT",
    nameAr: "توريد بوابات فرعية — إدارة ري دمياط",
    nameEn: "Supply of secondary gates — Damietta",
    approval: soonApproval,
    rows: [{ code: "damietta", amount: "860000.00", current: "PUBLICATION" }],
  });

  let back = 18;
  let halfwayApproval = addDays(today, -back);
  let halfwayDue = addMonths(halfwayApproval, 1);
  for (let guard = 0; guard < 40; guard += 1) {
    const span = diffDays(halfwayApproval, halfwayDue);
    const halfway = addDays(halfwayApproval, Math.ceil(span / 2));
    const remaining = diffDays(today, halfwayDue);
    if (diffDays(halfway, today) >= 0 && remaining > 5) break;
    back += 1;
    halfwayApproval = addDays(today, -back);
    halfwayDue = addMonths(halfwayApproval, 1);
  }
  await makeOperation({
    type: "EFFICIENCY",
    nameAr: "رفع كفاءة محطات الطلمبات — البحيرة",
    nameEn: "Pumping-station efficiency — Beheira",
    approval: halfwayApproval,
    rows: [{ code: "beheira", amount: "2300000.00", current: "PUBLICATION" }],
  });

  const progress = await prisma.departmentStageProgress.findMany();
  for (const row of progress) {
    const kinds = evaluateAlertTypes(
      { start: dateToIso(row.plannedStart), due: dateToIso(row.plannedDue), completed: Boolean(row.completedAt) },
      today,
    );
    for (const type of kinds) {
      await prisma.alert.create({
        data: { progressId: row.id, type, audience: type === "OVERDUE" ? "SECTOR" : "DEPARTMENT" },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: sectorUser.id,
      action: "SEED",
      entity: "Sector",
      entityId: sector.id,
      summaryAr: "تحميل بيانات التجربة لقطاع الري",
      summaryEn: "Loaded the Irrigation Sector demo",
    },
  });

  const example = computeStageWindows("2026-10-08", DEFAULT_STAGES);
  console.log("Cairo today:", today);
  console.log("Example windows:", example.map((item) => `${item.code} ${item.start} -> ${item.due}`).join(" | "));
  console.log("Departments:", DEPARTMENTS.length);
  console.log("Demo password:", DEMO_PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
