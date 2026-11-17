import { BoundForm, SubmitButton } from "@/components/form-bits";
import { TypeStudio } from "@/components/type-studio";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { PERMISSIONS, can, grantsOf } from "@/lib/permissions";
import { listTypes } from "@/lib/queries";
import { changePasswordAction } from "@/server/actions";
import { tx } from "@/lib/text";

export default async function SettingsPage() {
  const user = await requireUser();
  const locale = await getLocale();
  const manageTypes = can(user, "settings.types");
  const types = manageTypes ? await listTypes({ includeDeleted: true }) : [];
  const mine = grantsOf(user);
  return (
    <>
      <PageHeader kicker={tx(locale, "النظام", "System")} title={tx(locale, "الإعدادات", "Settings")} lede={tx(locale, "اللغة والمظهر من الشريط العلوي. هنا كلمة المرور، ومهام حسابك، وأنواع العمليات.", "Language and theme are in the top bar. Password, your tasks, and operation types are here.")} />
      <BoundForm action={changePasswordAction} className="card card-pad stack">
        <b>{tx(locale, "كلمة المرور", "Password")}</b>
        <div className="grid-3">
          <label className="field"><span>{tx(locale, "الحالية", "Current")}</span><input className="input" type="password" name="currentPassword" required /></label>
          <label className="field"><span>{tx(locale, "الجديدة", "New")}</span><input className="input" type="password" name="newPassword" minLength={8} required /></label>
          <label className="field"><span>{tx(locale, "التأكيد", "Confirm")}</span><input className="input" type="password" name="confirmPassword" minLength={8} required /></label>
        </div>
        <SubmitButton label={tx(locale, "تغيير كلمة المرور", "Change password")} pendingLabel={tx(locale, "جارٍ الحفظ", "Saving")} />
      </BoundForm>
      <section className="card card-pad stack">
        <b>{tx(locale, "مهامك", "Your tasks")}</b>
        <p className="note">{tx(locale, "هذه المهام المفتوحة لحسابك الآن، سواء كانت مهام الدور أو مهامًا خُصصت لك. التعيين لشخص أو لكل حسابات الدور يتم من صفحة المستخدمين.", "These are the tasks open on your account, from your role or assigned to you. Assignment for one person, or for every account of a role, is on the Users page.")}</p>
        <div className="row">
          {mine.length ? mine.map((key) => {
            const item = PERMISSIONS.find((entry) => entry.key === key);
            return <span key={key} className="chip">{item ? (locale === "ar" ? item.ar : item.en) : key}</span>;
          }) : <span className="note">{tx(locale, "لا مهام مفتوحة", "No open tasks")}</span>}
        </div>
      </section>
      {manageTypes ? (
        <TypeStudio
          types={types.map((type) => ({
            id: type.id,
            nameAr: type.nameAr,
            nameEn: type.nameEn,
            isSystem: type.isSystem,
            deletedAt: type.deletedAt ? type.deletedAt.toISOString() : null,
            deletedByName: type.deletedBy ? (locale === "ar" ? type.deletedBy.nameAr : type.deletedBy.nameEn) : null,
          }))}
        />
      ) : null}
    </>
  );
}
