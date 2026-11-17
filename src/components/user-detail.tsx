"use client";

import { useActionState, useState } from "react";
import { useI18n } from "@/i18n/context";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { assignTasksAction, deleteUserAction, toggleUserAction } from "@/server/actions";
import { FormMessage, SubmitButton } from "./form-bits";
import { Modal, useCloseWhenSaved } from "./modal";
import { Tip } from "./tip";

export function UserDetailButton({
  userId,
  name,
  email,
  roleText,
  roleHint,
  roleClass,
  organization,
  statusText,
  statusHint,
  statusClass,
  tasks,
  editableTasks,
  custom,
  canApplyRole,
  manageable,
  active,
}: {
  userId: string;
  name: string;
  email: string;
  roleText: string;
  roleHint: string;
  roleClass: string;
  organization: string;
  statusText: string;
  statusHint: string;
  statusClass: string;
  tasks: Permission[];
  editableTasks: Permission[];
  custom: boolean;
  canApplyRole: boolean;
  manageable: boolean;
  active: boolean;
}) {
  const { t, locale, d } = useI18n();
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(assignTasksAction, null);
  const [deleteState, deleteAction] = useActionState(deleteUserAction, null);
  useCloseWhenSaved(state, () => setOpen(false));
  useCloseWhenSaved(deleteState, () => setOpen(false));
  const lines = tasks.map((key) => {
    const item = PERMISSIONS.find((entry) => entry.key === key);
    return { key, label: item ? (locale === "ar" ? item.ar : item.en) : key };
  });
  const editable = PERMISSIONS.filter((item) => editableTasks.includes(item.key));

  function confirmSuspend(event: React.FormEvent<HTMLFormElement>) {
    const message = active
      ? t(`إيقاف حساب ${name}؟`, `Suspend account ${name}?`)
      : t(`تفعيل حساب ${name}؟`, `Activate account ${name}?`);
    if (!window.confirm(message)) event.preventDefault();
  }

  function confirmDelete(event: React.FormEvent<HTMLFormElement>) {
    const message = t(
      `حذف/إيقاف نهائي لحساب ${name}؟ لا يمكن التراجع بسهولة.`,
      `Permanently deactivate ${name}? This is hard to undo.`,
    );
    if (!window.confirm(message)) event.preventDefault();
  }

  return (
    <>
      <Tip text={t("تفاصيل الحساب", "Account details")}>
        <button className="icon-btn" type="button" onClick={() => setOpen(true)} aria-label={t("تفاصيل الحساب", "Account details")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16v12H4z" />
            <path d="M8 10h4M8 14h8" />
            <circle cx="16.5" cy="10" r="1" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </Tip>
      <Modal open={open} wide title={name} subtitle={email} onClose={() => setOpen(false)}>
        <div className="stack">
          <dl className="profile">
            <dt>{t("الدور", "Role")}</dt>
            <dd><Tip text={roleHint}><span className={roleClass}>{roleText}</span></Tip></dd>
            <dt>{t("الجهة", "Organization")}</dt>
            <dd>{organization}</dd>
            <dt>{t("الحالة", "Status")}</dt>
            <dd><Tip text={statusHint}><span className={statusClass}>{statusText}</span></Tip></dd>
            <dt>{t("مصدر المهام", "Task source")}</dt>
            <dd>{custom ? t("مهام خاصة بهذا الحساب", "Tasks set for this account") : t("مهام الدور الافتراضية", "The role's default tasks")}</dd>
          </dl>
          <div>
            <b>{t("المهام", "Tasks")}</b>
            {lines.length === 0 ? <p className="note">{t("لا مهام مفتوحة", "No open tasks")}</p> : (
              <ul className="task-rows">
                {lines.map((line) => <li key={line.key}>{line.label}</li>)}
              </ul>
            )}
          </div>
          {manageable ? (
            <form action={action} className="stack">
              <input type="hidden" name="userId" value={userId} />
              <b>{t("تعديل المهام", "Edit tasks")}</b>
              <p className="note">{t("التعديل يخص هذا الشخص. حساب الإدارة يبقى محصورًا ببيانات إدارته.", "The change belongs to this person. A department account still only sees that department's data.")}</p>
              <div className="task-list">
                {editable.map((item) => (
                  <label key={item.key} className="checkline">
                    <input type="checkbox" name="task" value={item.key} defaultChecked={tasks.includes(item.key)} />
                    <span>{locale === "ar" ? item.ar : item.en}</span>
                  </label>
                ))}
              </div>
              {canApplyRole ? (
                <label className="checkline">
                  <input type="checkbox" name="applyToRole" />
                  {t(`تطبيق نفس المهام على كل حسابات ${roleText}`, `Apply the same tasks to every ${roleText} account`)}
                </label>
              ) : null}
              <div className="row">
                <SubmitButton label={d.common.save} pendingLabel={d.common.saving} />
                <button className="btn btn-ghost" type="submit" name="reset" value="1">{t("العودة لمهام الدور", "Use the role tasks")}</button>
              </div>
              <FormMessage result={state?.ok ? null : state} />
            </form>
          ) : null}
          {manageable ? (
            <div className="stack">
              <form action={toggleUserAction} className="row" onSubmit={confirmSuspend}>
                <input type="hidden" name="id" value={userId} />
                <button className={active ? "btn btn-danger" : "btn btn-primary"} type="submit">
                  {active ? t("إيقاف الحساب", "Suspend account") : t("تفعيل الحساب", "Activate account")}
                </button>
              </form>
              {active ? (
                <form action={deleteAction} className="row" onSubmit={confirmDelete}>
                  <input type="hidden" name="id" value={userId} />
                  <SubmitButton className="btn btn-danger" label={t("حذف الحساب", "Delete account")} pendingLabel={d.common.saving} />
                  <FormMessage result={deleteState} />
                </form>
              ) : null}
              <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>{d.common.close}</button>
            </div>
          ) : (
            <div className="row">
              <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>{d.common.close}</button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
