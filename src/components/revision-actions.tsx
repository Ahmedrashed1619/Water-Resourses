"use client";

import { useI18n } from "@/i18n/context";
import { markRevisionsSeenAction } from "@/server/actions";
import { ActionIcon } from "./table-actions";

export function RevisionSeenButton({ id }: { id: string }) {
  const { t } = useI18n();
  return (
    <form action={markRevisionsSeenAction}>
      <input type="hidden" name="id" value={id} />
      <ActionIcon tip={t("تمت المشاهدة", "Mark seen")} icon="seen" tone="success" type="submit" />
    </form>
  );
}
