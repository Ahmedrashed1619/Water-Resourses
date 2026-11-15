"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/context";
import { setLocaleAction } from "@/server/actions";

export function LocaleToggle() {
  const { locale } = useI18n();
  const router = useRouter();
  return (
    <button
      className="btn btn-ghost btn-sm"
      type="button"
      onClick={async () => {
        await setLocaleAction(locale === "ar" ? "en" : "ar");
        router.refresh();
      }}
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}

export function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      className="btn btn-ghost btn-sm"
      type="button"
      onClick={() => {
        const next = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", next);
        const value = next ? "dark" : "light";
        localStorage.setItem("operio-theme", value);
        document.cookie = `theme=${value};path=/;max-age=31536000;samesite=lax`;
        setDark(next);
      }}
    >
      {dark ? t("وضع فاتح", "Light") : t("وضع داكن", "Dark")}
    </button>
  );
}
