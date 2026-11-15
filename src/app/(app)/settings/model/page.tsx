import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { can } from "@/lib/permissions";
import { tx } from "@/lib/text";

const TABLES: { code: string; ar: string; en: string; noteAr: string; noteEn: string }[] = [
  { code: "sectors", ar: "القطاع", en: "Sector", noteAr: "سجل واحد: قطاع الري", noteEn: "One record: the Irrigation Sector" },
  { code: "departments", ar: "الإدارات", en: "Departments", noteAr: "ثلاث وثلاثون إدارة تابعة للقطاع", noteEn: "Thirty-three departments under the Sector" },
  { code: "users", ar: "المستخدمون", en: "Users", noteAr: "الدور، والإدارة فارغة لحساب القطاع", noteEn: "Role, with no department on a sector account" },
  { code: "operation_types", ar: "أنواع العمليات", en: "Operation types", noteAr: "تطهيرات، رفع كفاءة، استثماري، أخرى، وما يُضاف", noteEn: "Dredging, efficiency, investment, other, and anything added" },
  { code: "stage_definitions", ar: "تعريف المراحل", en: "Stage definitions", noteAr: "المدة وقاعدة الحساب لكل نوع", noteEn: "Duration and the counting rule for each type" },
  { code: "operations", ar: "العمليات", en: "Operations", noteAr: "الاسم والنوع وتاريخ الموافقة الفنية", noteEn: "Name, type, and the technical approval date" },
  { code: "operation_departments", ar: "تخصيص الإدارة", en: "Assignment", noteAr: "عملية لعدة إدارات، واعتماد لكل إدارة", noteEn: "One operation, many departments, and an approval for each" },
  { code: "financial_adjustments", ar: "التعديلات المالية", en: "Adjustments", noteAr: "فرق مؤرخ، والسبب اختياري", noteEn: "A dated delta. The reason is optional" },
  { code: "department_stage_progress", ar: "تنفيذ المرحلة", en: "Stage progress", noteAr: "موعد مرجعي ثابت وموعد مخطط قابل للتعديل", noteEn: "A fixed baseline and an editable plan" },
  { code: "stage_date_changes", ar: "تعديل المواعيد", en: "Date changes", noteAr: "القديم والجديد والسبب ومن ومتى", noteEn: "Old date, new date, reason, who, and when" },
  { code: "alerts", ar: "التنبيهات", en: "Alerts", noteAr: "التجاوز للقطاع، ومنتصف المدة وقبل خمسة أيام للإدارة", noteEn: "Overdue for the Sector; halfway and five days for the department" },
  { code: "audit_logs", ar: "سجل النشاط", en: "Activity log", noteAr: "أثر الكتابة على النظام", noteEn: "A trace of writes on the system" },
];

export default async function ModelPage() {
  const user = await requireUser();
  if (!can(user, "settings.types")) redirect("/settings");
  const locale = await getLocale();
  return (
    <>
      <PageHeader kicker={tx(locale, "قاعدة البيانات", "Database")} title={tx(locale, "صورة المخطط", "Schema picture")} lede={tx(locale, "التشغيل المحلي على قاعدة ملفّية. ملف النقل إلى خادم البيانات جاهز في database/schema.sql.", "The local runtime uses a file database. database/schema.sql is ready to create the same tables on a data server.")} />
      <div className="schema-grid">
        {TABLES.map((table) => (
          <article key={table.code} className="schema-card">
            <header>{table.code}</header>
            <ul>
              <li><b>{locale === "ar" ? table.ar : table.en}</b></li>
              <li className="fine">{locale === "ar" ? table.noteAr : table.noteEn}</li>
            </ul>
          </article>
        ))}
      </div>
      <section className="card card-pad stack">
        <h2>{tx(locale, "العلاقات التي تحمي القاعدة", "Relationships that protect the rules")}</h2>
        <ul>
          <li>{tx(locale, "العملية الواحدة تتخصص لأكثر من إدارة عبر operation_departments، بقيد فريد على الزوج.", "An operation reaches many departments through operation_departments, with a unique pair.")}</li>
          <li>{tx(locale, "لكل تخصيص صف تقدم واحد لكل مرحلة. المرجعي لا يُكتب عليه مرة ثانية.", "Each assignment has one progress row per stage. The baseline is not rewritten.")}</li>
          <li>{tx(locale, "النشر والفتح الفني والفتح المالي من تاريخ الموافقة. البت المالي من نهو الفتح المالي المرجعي + 7 أيام.", "Publication, technical opening, and financial opening start at approval. Award is the financial-opening baseline plus 7 days.")}</li>
          <li>{tx(locale, "القيمة الحالية = الاعتماد الأصلي + مجموع الفروق. الحذف منطقي.", "Current amount = original approval + the sum of deltas. Deletion is logical.")}</li>
        </ul>
      </section>
    </>
  );
}
