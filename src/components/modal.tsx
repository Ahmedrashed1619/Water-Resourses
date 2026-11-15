"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/context";

export function useCloseWhenSaved(state: { ok: boolean } | null, onClose: () => void) {
  const previous = useRef(state);
  useEffect(() => {
    if (state?.ok && previous.current !== state) onClose();
    previous.current = state;
  }, [state, onClose]);
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const { t } = useI18n();
  if (!open) return null;

  return (
    <div className="popup-root">
      <button className="popup-backdrop" type="button" aria-label={t("إغلاق", "Close")} onClick={onClose} />
      <div className={wide ? "popup wide" : "popup"} role="dialog" aria-modal="true" aria-label={title}>
        <header className="popup-head">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p className="note">{subtitle}</p> : null}
          </div>
          <button className="icon-btn" type="button" onClick={onClose} aria-label={t("إغلاق", "Close")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>
        <div className="popup-body">{children}</div>
      </div>
    </div>
  );
}
