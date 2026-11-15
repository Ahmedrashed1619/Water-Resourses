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
  | "finance.manage"
  | "alerts.sector"
  | "alerts.department"
  | "reports.export"
  | "departments.view"
  | "users.manage"
  | "users.manageAll"
  | "settings.types"
  | "revisions.view"
  | "audit.view";

const MATRIX: Record<Role, Permission[]> = {
  SECTOR_SUPER_ADMIN: [
    "operations.manage",
    "finance.manage",
    "alerts.sector",
    "reports.export",
    "departments.view",
    "users.manage",
    "users.manageAll",
    "settings.types",
    "revisions.view",
    "audit.view",
  ],
  SECTOR_ADMIN: [
    "operations.manage",
    "finance.manage",
    "alerts.sector",
    "reports.export",
    "departments.view",
    "users.manage",
    "revisions.view",
  ],
  SECTOR_EMPLOYEE: ["alerts.sector", "departments.view", "revisions.view"],
  DEPARTMENT_SUPER_ADMIN: ["alerts.department", "users.manage"],
  DEPARTMENT_ADMIN: ["alerts.department", "users.manage"],
  DEPARTMENT_EMPLOYEE: ["alerts.department"],
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

export function rankOf(role: string): Rank | null {
  const canonical = canonicalRole(role);
  if (!canonical) return null;
  if (canonical.endsWith("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (canonical.endsWith("EMPLOYEE")) return "EMPLOYEE";
  return "ADMIN";
}

const KEYS = new Set<string>([
  "operations.manage",
  "finance.manage",
  "alerts.sector",
  "alerts.department",
  "reports.export",
  "departments.view",
  "users.manage",
  "users.manageAll",
  "settings.types",
  "revisions.view",
  "audit.view",
]);

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
    if (rankOf(actor.role) === "SUPER_ADMIN") return ["DEPARTMENT_SUPER_ADMIN", "DEPARTMENT_ADMIN", "DEPARTMENT_EMPLOYEE"];
    if (rankOf(actor.role) === "ADMIN") return ["DEPARTMENT_EMPLOYEE"];
    return [];
  }
  if (can(actor, "users.manageAll")) return ["SECTOR_SUPER_ADMIN", "SECTOR_ADMIN", "SECTOR_EMPLOYEE"];
  if (rankOf(actor.role) === "ADMIN") return ["SECTOR_EMPLOYEE"];
  return [];
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

export const PERMISSIONS: { key: Permission; ar: string; en: string }[] = [
  { key: "operations.manage", ar: "إنشاء العمليات وتخصيصها وحذفها", en: "Create, assign, and delete operations" },
  { key: "finance.manage", ar: "تسجيل الاعتماد والتعديلات المالية", en: "Record approvals and financial adjustments" },
  { key: "alerts.sector", ar: "تنبيهات التجاوز وتصديرها", en: "Overdue alerts and exports" },
  { key: "alerts.department", ar: "تنبيها منتصف المدة وقبل خمسة أيام", en: "Halfway and five-day alerts" },
  { key: "reports.export", ar: "تصدير التقارير: جدول ومستند وصورة", en: "Export reports as a spreadsheet, a document, and an image" },
  { key: "departments.view", ar: "رؤية كل الإدارات", en: "View every department" },
  { key: "users.manage", ar: "إدارة حسابات نفس الجهة", en: "Manage accounts in the same organization" },
  { key: "users.manageAll", ar: "إنشاء كل رتب القطاع", en: "Create every sector rank" },
  { key: "settings.types", ar: "أنواع العمليات والمراحل", en: "Operation types and stages" },
  { key: "revisions.view", ar: "الاطلاع على أسباب تعديل المواعيد", en: "Review date-change reasons" },
  { key: "audit.view", ar: "سجل النشاط", en: "Activity log" },
];

export function audienceFor(role: string): "SECTOR" | "DEPARTMENT" {
  return isDepartmentRole(role) ? "DEPARTMENT" : "SECTOR";
}
