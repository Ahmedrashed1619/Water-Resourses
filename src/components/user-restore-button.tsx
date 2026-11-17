"use client";

import { useI18n } from "@/i18n/context";
import { restoreUserAction } from "@/server/actions";
import { BoundForm } from "./form-bits";
import { ActionIcon } from "./table-actions";

export function UserRestoreButton({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <BoundForm action={restoreUserAction} silent>
      <input type="hidden" name="id" value={id} />
      <ActionIcon tip={t("استرجاع", "Restore")} icon="restore" tone="primary" type="submit" />
    </BoundForm>
  );
}
