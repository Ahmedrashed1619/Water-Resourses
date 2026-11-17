export type Role =
  | "SECTOR_SUPER_ADMIN"
  | "SECTOR_ADMIN"
  | "SECTOR_EMPLOYEE"
  | "DEPARTMENT_SUPER_ADMIN"
  | "DEPARTMENT_ADMIN"
  | "DEPARTMENT_EMPLOYEE";

export type Rank = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";

export type Permission =
  | "operations.manage"
  | "operations.report"
  | "finance.manage"
  | "alerts.sector"
  | "alerts.manage"
  | "alerts.deletedLog.view"
  | "alerts.department"
  | "reports.export"
  | "reports.print"
  | "reports.overrun"
  | "reports.overrun.download"
  | "departments.view"
  | "users.manage"
  | "users.manageAll"
  | "settings.types"
  | "revisions.view"
  | "audit.view"
  | "needs.create"
  | "needs.view"
  | "needs.respond"
  | "needs.report"
  | "stages.execute"
  | "stages.select"
  | "stages.add"
  | "stages.createType"
  | "stageActivity.view"
  | "dates.edit";

const MATRIX: Record<Role, Permission[]> = {
  SECTOR_SUPER_ADMIN: [
    "operations.manage",
    "operations.report",
    "finance.manage",
    "alerts.sector",
    "alerts.manage",
    "alerts.deletedLog.view",
    "reports.export",
    "reports.print",
    "reports.overrun",
    "reports.overrun.download",
    "departments.view",
    "users.manage",
    "users.manageAll",
    "settings.types",
    "revisions.view",
    "audit.view",
    "needs.view",
    "needs.respond",
    "needs.report",
    "stageActivity.view",
  ],
  SECTOR_ADMIN: [
    "operations.manage",
    "operations.report",
    "finance.manage",
    "alerts.sector",
    "alerts.manage",
    "alerts.deletedLog.view",
    "reports.export",
    "reports.print",
    "reports.overrun",
    "reports.overrun.download",
    "departments.view",
    "users.manage",
    "settings.types",
    "revisions.view",
    "audit.view",
    "needs.view",
    "needs.respond",
    "needs.report",
    "stageActivity.view",
  ],
  SECTOR_EMPLOYEE: [
    "operations.report",
    "alerts.sector",
    "alerts.deletedLog.view",
    "departments.view",
    "revisions.view",
    "reports.print",
    "reports.overrun",
    "reports.overrun.download",
    "needs.view",
    "needs.report",
    "stageActivity.view",
  ],
  DEPARTMENT_SUPER_ADMIN: [
    "alerts.department",
    "users.manage",
    "reports.print",
    "operations.report",
    "needs.create",
    "needs.view",
    "needs.report",
    "stages.execute",
    "stages.select",
    "stages.add",
    "stages.createType",
    "stageActivity.view",
    "dates.edit",
  ],
  DEPARTMENT_ADMIN: [
    "alerts.department",
    "users.manage",
    "reports.print",
    "operations.report",
    "needs.create",
    "needs.view",
    "needs.report",
    "stages.execute",
    "stages.select",
    "stages.add",
    "stages.createType",
    "stageActivity.view",
    "dates.edit",
  ],
  DEPARTMENT_EMPLOYEE: [
    "alerts.department",
    "reports.print",
    "operations.report",
    "stageActivity.view",
  ],
};

const LEGACY: Record<string, Role> = {
  SUPER_ADMIN: "SECTOR_SUPER_ADMIN",
  SECTOR: "SECTOR_ADMIN",
  DEPARTMENT: "DEPARTMENT_EMPLOYEE",
};

export function canonicalRole(value: string): Role | null {
  if (value in MATRIX) return value as Role;
  return LEGACY[value] ?? null;
}

export function isRole(value: string): value is Role {
  return canonicalRole(value) !== null && value in MATRIX;
}

export function isDepartmentRole(role: string) {
  const canonical = canonicalRole(role) ?? role;
  return canonical.startsWith("DEPARTMENT");
}

export function isSectorRole(role: string) {
  const canonical = canonicalRole(role) ?? role;
  return canonical.startsWith("SECTOR");
}

export function rankOf(role: string): Rank | null {
  const canonical = canonicalRole(role);
  if (!canonical) return null;
  if (canonical.endsWith("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (canonical.endsWith("EMPLOYEE")) return "EMPLOYEE";
  return "ADMIN";
}

const KEYS = new Set<string>(PERMISSIONS_KEYS());

function PERMISSIONS_KEYS(): Permission[] {
  return [
    "operations.manage",
    "operations.report",
    "finance.manage",
    "alerts.sector",
    "alerts.manage",
    "alerts.deletedLog.view",
    "alerts.department",
    "reports.export",
    "reports.print",
    "reports.overrun",
    "reports.overrun.download",
    "departments.view",
    "users.manage",
    "users.manageAll",
    "settings.types",
    "revisions.view",
    "audit.view",
    "needs.create",
    "needs.view",
    "needs.respond",
    "needs.report",
    "stages.execute",
    "stages.select",
    "stages.add",
    "stages.createType",
    "stageActivity.view",
    "dates.edit",
  ];
}

export function isPermission(value: string): value is Permission {
  return KEYS.has(value);
}

export function roleGrants(role: string): Permission[] {
  const canonical = canonicalRole(role);
  return canonical ? [...MATRIX[canonical]] : [];
}

export function creatableRoles(actor: { role: string; tasks?: string | null }): Role[] {
  if (!can(actor, "users.manage")) return [];
  if (isDepartmentRole(actor.role)) {
    if (rankOf(actor.role) === "SUPER_ADMIN") return ["DEPARTMENT_ADMIN", "DEPARTMENT_EMPLOYEE"];
    if (rankOf(actor.role) === "ADMIN") return ["DEPARTMENT_EMPLOYEE"];
    return [];
  }
  if (can(actor, "users.manageAll")) return ["SECTOR_SUPER_ADMIN", "SECTOR_ADMIN", "SECTOR_EMPLOYEE"];
  if (rankOf(actor.role) === "ADMIN") return ["SECTOR_EMPLOYEE"];
  return [];
}

/** Permissions a creator may assign when creating/editing employees. */
export function assignableTaskKeys(actor: { role: string; tasks?: string | null }): Permission[] {
  if (isDepartmentRole(actor.role)) {
    if (rankOf(actor.role) === "SUPER_ADMIN") {
      return [
        "alerts.department",
        "reports.print",
        "operations.report",
        "needs.view",
        "needs.report",
        "stages.execute",
        "stages.select",
        "stages.add",
        "dates.edit",
        "stageActivity.view",
      ];
    }
    // DA: employees get fixed view + print only — no edit/execute grants in the form
    return ["alerts.department", "reports.print", "operations.report", "needs.view", "needs.report", "stageActivity.view"];
  }
  if (rankOf(actor.role) === "ADMIN" && !can(actor, "users.manageAll")) {
    return [
      "alerts.sector",
      "alerts.deletedLog.view",
      "departments.view",
      "revisions.view",
      "reports.print",
      "reports.overrun",
      "reports.overrun.download",
      "needs.view",
      "needs.report",
      "operations.report",
      "stageActivity.view",
    ];
  }
  return PERMISSIONS.map((item) => item.key).filter((key) => key !== "users.manageAll" || can(actor, "users.manageAll"));
}

export function parseTasks(raw: string | null | undefined): Permission[] | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return null;
    return value.filter((item): item is Permission => typeof item === "string" && isPermission(item));
  } catch {
    return null;
  }
}

export function grantsOf(actor: string | { role: string; tasks?: string | null }): Permission[] {
  if (typeof actor !== "string") {
    const custom = parseTasks(actor.tasks);
    if (custom) return custom;
    return roleGrants(actor.role);
  }
  return roleGrants(actor);
}

export function can(actor: string | { role: string; tasks?: string | null }, permission: Permission): boolean {
  return grantsOf(actor).includes(permission);
}

/** Hide higher-rank accounts from the actor's users list. */
export function canSeeUserAccount(
  actor: { role: string },
  target: { role: string },
): boolean {
  if (isSectorRole(actor.role) && isSectorRole(target.role)) {
    if (rankOf(actor.role) === "ADMIN" && rankOf(target.role) === "SUPER_ADMIN") return false;
    if (rankOf(actor.role) === "EMPLOYEE") return false;
  }
  if (isDepartmentRole(actor.role) && isDepartmentRole(target.role)) {
    if (rankOf(actor.role) === "ADMIN" && rankOf(target.role) === "SUPER_ADMIN") return false;
    if (rankOf(actor.role) === "EMPLOYEE") return false;
  }
  return true;
}

export function audienceFor(role: string): "SECTOR" | "DEPARTMENT" {
  return isDepartmentRole(role) ? "DEPARTMENT" : "SECTOR";
}

/** Sector-facing status: only in-execution or overdue (hide halfway / due soon). */
export function sectorFacingStatus(status: string): "in_execution" | "overdue" | "completed" | "idle" {
  if (status === "overdue" || status === "LATE") return "overdue";
  if (status === "completed" || status === "COMPLETED_ON_TIME" || status === "COMPLETED_LATE") return "completed";
  if (status === "idle") return "idle";
  return "in_execution";
}

export const PERMISSIONS: { key: Permission; ar: string; en: string }[] = [
  { key: "operations.manage", ar: "إنشاء العمليات وتخصيصها وحذفها", en: "Create, assign, and delete operations" },
  { key: "operations.report", ar: "تنزيل تقرير العمليات", en: "Download operations report" },
  { key: "finance.manage", ar: "تسجيل الاعتماد والدفعات المالية", en: "Record approvals and funding tranches" },
  { key: "alerts.sector", ar: "تنبيهات التجاوز", en: "Overdue alerts" },
  { key: "alerts.manage", ar: "حذف أو استرجاع تنبيهات التجاوز", en: "Delete or restore overdue alerts" },
  { key: "alerts.deletedLog.view", ar: "سجل التنبيهات المحذوفة", en: "View deleted alerts log" },
  { key: "alerts.department", ar: "تنبيها منتصف المدة وقبل خمسة أيام", en: "Halfway and five-day alerts" },
  { key: "reports.export", ar: "تصدير التقارير إلى Excel", en: "Export reports to Excel" },
  { key: "reports.print", ar: "طباعة التقارير", en: "Print reports" },
  { key: "reports.overrun", ar: "تقرير التجاوز", en: "Overrun report" },
  { key: "reports.overrun.download", ar: "تنزيل تقرير التجاوز", en: "Download overrun report" },
  { key: "departments.view", ar: "رؤية الإدارات", en: "View departments" },
  { key: "users.manage", ar: "إدارة حسابات نفس الجهة", en: "Manage accounts in the same organization" },
  { key: "users.manageAll", ar: "إنشاء كل رتب القطاع", en: "Create every sector rank" },
  { key: "settings.types", ar: "أنواع العمليات", en: "Operation types" },
  { key: "revisions.view", ar: "الاطلاع على أسباب تعديل المواعيد", en: "Review date-change reasons" },
  { key: "audit.view", ar: "سجل النشاط", en: "Activity log" },
  { key: "needs.create", ar: "تقديم طلبات احتياج العمليات", en: "Submit operation needs requests" },
  { key: "needs.view", ar: "الاطلاع على طلبات الاحتياج", en: "View needs requests" },
  { key: "needs.respond", ar: "الرد على طلبات الاحتياج", en: "Respond to needs requests" },
  { key: "needs.report", ar: "تنزيل تقرير طلبات الاحتياج", en: "Download needs requests report" },
  { key: "stages.execute", ar: "بدء وإنهاء المراحل", en: "Start and finish stages" },
  { key: "stages.select", ar: "اختيار مراحل العمل", en: "Select stages to work on" },
  { key: "stages.add", ar: "إضافة مرحلة للعملية", en: "Add a stage to an operation" },
  { key: "stages.createType", ar: "إنشاء نوع مرحلة خاص بالإدارة", en: "Create a department-scoped stage type" },
  { key: "stageActivity.view", ar: "رؤية نشاط مراحل الإدارات", en: "View department stage activity" },
  { key: "dates.edit", ar: "تعديل تواريخ المراحل", en: "Edit stage dates" },
];
