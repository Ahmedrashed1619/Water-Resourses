"use client";

import { useI18n } from "@/i18n/context";

export default function Loading() {
  const { t } = useI18n();
  return <div className="card card-pad"><p className="muted">{t("جارٍ التحميل", "Loading")}</p></div>;
}
