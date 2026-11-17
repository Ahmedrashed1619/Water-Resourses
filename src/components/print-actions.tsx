"use client";

import { useI18n } from "@/i18n/context";

export function PrintActions() {
  const { t } = useI18n();
  return (
    <div className="print-actions no-print">
      <button className="btn btn-primary" type="button" onClick={() => window.print()}>
        {t("طباعة", "Print")}
      </button>
      <button className="btn" type="button" onClick={() => window.history.back()}>
        {t("رجوع", "Back")}
      </button>
    </div>
  );
}
