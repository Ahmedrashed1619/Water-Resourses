import type { StageVisualStatus } from "./rules";
import type { Locale } from "./text";

export function statusLabel(locale: Locale, status: StageVisualStatus | "idle") {
  const ar: Record<string, string> = {
    overdue: "متأخر",
    due_soon: "قرب الموعد",
    halfway: "منتصف المدة",
    on_track: "في المسار",
    pending: "لم تبدأ",
    completed: "منتهية",
    idle: "بدون عمليات",
  };
  const en: Record<string, string> = {
    overdue: "Overdue",
    due_soon: "Due soon",
    halfway: "Halfway",
    on_track: "On track",
    pending: "Not started",
    completed: "Completed",
    idle: "No operations",
  };
  return (locale === "ar" ? ar : en)[status] ?? status;
}

export function roleLabel(locale: Locale, role: string) {
  const ar: Record<string, string> = {
    SECTOR_SUPER_ADMIN: "مسؤول أعلى · القطاع",
    SECTOR_ADMIN: "مدير · القطاع",
    SECTOR_EMPLOYEE: "موظف · القطاع",
    DEPARTMENT_SUPER_ADMIN: "مسؤول أعلى · الإدارة",
    DEPARTMENT_ADMIN: "مدير · الإدارة",
    DEPARTMENT_EMPLOYEE: "موظف · الإدارة",
    SUPER_ADMIN: "مسؤول أعلى · القطاع",
    SECTOR: "مدير · القطاع",
    DEPARTMENT: "موظف · الإدارة",
  };
  const en: Record<string, string> = {
    SECTOR_SUPER_ADMIN: "Super admin · Sector",
    SECTOR_ADMIN: "Admin · Sector",
    SECTOR_EMPLOYEE: "Employee · Sector",
    DEPARTMENT_SUPER_ADMIN: "Super admin · Department",
    DEPARTMENT_ADMIN: "Admin · Department",
    DEPARTMENT_EMPLOYEE: "Employee · Department",
    SUPER_ADMIN: "Super admin · Sector",
    SECTOR: "Admin · Sector",
    DEPARTMENT: "Employee · Department",
  };
  return (locale === "ar" ? ar : en)[role] ?? role;
}

export function roleHint(locale: Locale, role: string) {
  const ar: Record<string, string> = {
    SECTOR_SUPER_ADMIN: "يدير حسابات القطاع ورتبها، ولا يدخل على مستخدمي الإدارات.",
    SECTOR_ADMIN: "يتابع عمليات القطاع ويدير الموظفين، دون صلاحية المسؤول الأعلى.",
    SECTOR_EMPLOYEE: "يرى متابعة القطاع دون إنشاء عمليات أو إدارة حسابات.",
    DEPARTMENT_SUPER_ADMIN: "يدير حسابات إدارته فقط. لا يرى مستخدمي القطاع ولا الإدارات الأخرى.",
    DEPARTMENT_ADMIN: "يدير موظفي إدارته ويتابع تنبيهاتها.",
    DEPARTMENT_EMPLOYEE: "يعمل على مراحل إدارته ويرى تنبيهات منتصف المدة وقبل خمسة أيام.",
  };
  const en: Record<string, string> = {
    SECTOR_SUPER_ADMIN: "Manages sector accounts and ranks, and does not manage department users.",
    SECTOR_ADMIN: "Follows sector operations and manages employees, without the super-admin rank.",
    SECTOR_EMPLOYEE: "Sees sector follow-up, and does not create operations or manage accounts.",
    DEPARTMENT_SUPER_ADMIN: "Manages only this department's accounts. Other departments and the sector stay out of reach.",
    DEPARTMENT_ADMIN: "Manages this department's employees and follows its alerts.",
    DEPARTMENT_EMPLOYEE: "Works this department's stages and sees halfway and five-day alerts.",
  };
  const key = role === "SUPER_ADMIN" ? "SECTOR_SUPER_ADMIN" : role === "SECTOR" ? "SECTOR_ADMIN" : role === "DEPARTMENT" ? "DEPARTMENT_EMPLOYEE" : role;
  return (locale === "ar" ? ar : en)[key] ?? roleLabel(locale, role);
}

export function statusHint(locale: Locale, status: string) {
  const ar: Record<string, string> = {
    overdue: "الموعد المخطط فات والمرحلة لم تُغلق. التنبيه عند القطاع.",
    due_soon: "باقي خمسة أيام أو أقل على النهو المخطط.",
    halfway: "العمل عبر نصف المدة وما زال قبل موعد النهو.",
    on_track: "المرحلة جارية ولم تبلغ منتصف المدة.",
    pending: "لم يبدأ العمل على هذه المرحلة بعد.",
    completed: "المرحلة أُغلقت، ولا يصدر عنها تنبيه.",
    idle: "لا توجد عملية جارية على هذه الإدارة.",
    active: "الحساب يستطيع الدخول والعمل حسب مهامه.",
    inactive: "الحساب موقوف ولا يستطيع الدخول.",
  };
  const en: Record<string, string> = {
    overdue: "The planned date has passed and the stage is still open. The Sector holds the alert.",
    due_soon: "Five days or fewer remain before the planned finish.",
    halfway: "Work has passed halfway and the finish date is still ahead.",
    on_track: "The stage is underway and has not reached halfway.",
    pending: "Work on this stage has not started.",
    completed: "The stage is closed and raises no alert.",
    idle: "This department has no open operation.",
    active: "The account can sign in and work within its tasks.",
    inactive: "The account is suspended and cannot sign in.",
  };
  return (locale === "ar" ? ar : en)[status] ?? status;
}

export function alertLabel(locale: Locale, type: string) {
  const ar: Record<string, string> = {
    OVERDUE: "تجاوز المدة",
    HALFWAY: "منتصف المدة",
    DUE_SOON: "قبل الانتهاء بخمسة أيام",
  };
  const en: Record<string, string> = {
    OVERDUE: "Overdue",
    HALFWAY: "Halfway",
    DUE_SOON: "Five days before due",
  };
  return (locale === "ar" ? ar : en)[type] ?? type;
}

export function actionLabel(locale: Locale, action: string) {
  const ar: Record<string, string> = {
    LOGIN: "تسجيل دخول",
    CREATE_OPERATION: "إنشاء عملية",
    RENAME_OPERATION: "تعديل اسم عملية",
    DELETE_OPERATION: "حذف عملية",
    ASSIGN_DEPARTMENTS: "تخصيص إدارات",
    REMOVE_ASSIGNMENT: "إزالة تخصيص",
    FINANCIAL_ADJUSTMENT: "تعديل مالي",
    APPROVAL_WINDOW: "فترة الاعتماد",
    STAGE_DATES: "تعديل موعد",
    COMPLETE_STAGE: "إنهاء مرحلة",
    REOPEN_STAGE: "إعادة فتح مرحلة",
    DELETE_ALERT: "حذف تنبيه",
    RESTORE_ALERT: "استرجاع تنبيه",
    CREATE_USER: "إضافة مستخدم",
    TOGGLE_USER: "تفعيل أو إيقاف حساب",
    CREATE_TYPE: "نوع عملية جديد",
    CREATE_STAGE: "مرحلة جديدة",
    CREATE_DEPT_STAGE_TYPE: "نوع مرحلة خاص بإدارة",
    ADD_STAGE_TO_ASSIGNMENT: "إضافة مرحلة لعملية",
    ASSIGN_TASKS: "تعيين مهام",
  };
  const en: Record<string, string> = {
    LOGIN: "Signed in",
    CREATE_OPERATION: "Created an operation",
    RENAME_OPERATION: "Renamed an operation",
    DELETE_OPERATION: "Deleted an operation",
    ASSIGN_DEPARTMENTS: "Assigned departments",
    REMOVE_ASSIGNMENT: "Removed an assignment",
    FINANCIAL_ADJUSTMENT: "Financial adjustment",
    APPROVAL_WINDOW: "Approval window",
    STAGE_DATES: "Revised a date",
    COMPLETE_STAGE: "Completed a stage",
    REOPEN_STAGE: "Reopened a stage",
    DELETE_ALERT: "Deleted an alert",
    RESTORE_ALERT: "Restored an alert",
    CREATE_USER: "Added a user",
    TOGGLE_USER: "Activated or suspended an account",
    CREATE_TYPE: "New operation type",
    CREATE_STAGE: "New stage",
    CREATE_DEPT_STAGE_TYPE: "Department stage type created",
    ADD_STAGE_TO_ASSIGNMENT: "Stage added to an operation",
    ASSIGN_TASKS: "Assigned tasks",
  };
  return (locale === "ar" ? ar : en)[action] ?? (locale === "ar" ? "إجراء مسجّل" : "Recorded action");
}

export function fieldLabel(locale: Locale, field: string) {
  if (field === "START") return locale === "ar" ? "بدء مخطط" : "Planned start";
  if (field === "DUE") return locale === "ar" ? "نهو مخطط" : "Planned finish";
  if (field === "STAGE") return locale === "ar" ? "مرحلة" : "Stage";
  return field;
}

export function changeKindLabel(locale: Locale, kind?: string) {
  if (kind === "STAGE_ADDED") return locale === "ar" ? "إضافة مرحلة" : "Stage added";
  if (kind === "DATES_SET") return locale === "ar" ? "تحديد المواعيد" : "Dates set";
  return locale === "ar" ? "تعديل موعد" : "Date revised";
}
