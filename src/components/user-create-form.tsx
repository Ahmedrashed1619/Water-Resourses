"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { isDepartmentRole } from "@/lib/permissions";
import { createUserAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
import { Modal, useCloseWhenSaved } from "./modal";
import { SelectBox } from "./select-box";

export function UserCreateForm({
  roles,
  departments,
  lockDepartmentId,
}: {
  roles: { value: string; label: string }[];
  departments: { id: string; nameAr: string; nameEn: string }[];
  lockDepartmentId: string | null;
}) {
  const { d, t, name } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createUserAction, null);
  const [role, setRole] = useState(roles[0]?.value ?? "DEPARTMENT_EMPLOYEE");
  useCloseWhenSaved(state, () => setOpen(false));
  if (!roles.length) return null;
  const needsDepartment = isDepartmentRole(role) && !lockDepartmentId;

  return (
    <>
      <button className="btn btn-primary" type="button" onClick={() => setOpen(true)}>
        {t("مستخدم جديد", "New user")}
      </button>
      <Modal open={open} title={t("مستخدم جديد", "New user")} subtitle={t("الدور يحدد جهة الحساب: القطاع أو إدارته، والرتبة تحدد مهامه الافتراضية.", "The role sets the organization, sector or department, and the rank sets the default tasks.")} onClose={() => setOpen(false)}>
        <form action={action} className="stack">
          <div className="grid-2">
            <label className="field"><span>{t("الاسم بالعربية", "Arabic name")}</span><input className="input" name="nameAr" required /></label>
            <label className="field"><span>{t("الاسم بالإنجليزية", "English name")}</span><input className="input" name="nameEn" /></label>
            <label className="field"><span>{d.common.email}</span><input className="input" type="email" name="email" required /></label>
            <label className="field"><span>{d.common.password}</span><input className="input" type="password" name="password" minLength={8} required /></label>
            <label className="field">
              <span>{t("الدور", "Role")}</span>
              <SelectBox name="role" value={role} onChange={setRole} options={roles} />
            </label>
            {needsDepartment ? (
              <label className="field">
                <span>{t("الإدارة", "Department")}</span>
                <SelectBox
                  name="departmentId"
                  required
                  defaultValue=""
                  options={[{ value: "", label: t("اختر", "Choose") }, ...departments.map((item) => ({ value: item.id, label: name(item.nameAr, item.nameEn) }))]}
                />
              </label>
            ) : <input type="hidden" name="departmentId" value={lockDepartmentId ?? ""} />}
          </div>
          <div className="row">
            <SubmitButton label={d.common.add} pendingLabel={d.common.saving} />
            <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>{d.common.cancel}</button>
          </div>
          <FormMessage result={state?.ok ? null : state} />
        </form>
      </Modal>
    </>
  );
}
