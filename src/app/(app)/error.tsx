"use client";

import { useI18n } from "@/i18n/context";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="card card-pad stack">
      <h1>{t("تعذر تحميل هذه الصفحة", "This page could not be loaded")}</h1>
      <button className="btn btn-primary" type="button" onClick={() => reset()}>{t("إعادة المحاولة", "Try again")}</button>
    </div>
  );
}
