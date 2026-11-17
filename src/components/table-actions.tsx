"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/context";
import { Tip } from "./tip";

const ICONS = {
  delete: "M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12",
  restore: "M5 12a7 7 0 1 0 2-4.9M5 4v4h4",
  seen: "M4 12l5 5L20 6",
  view: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
} as const;

export type ActionIconName = keyof typeof ICONS;

export function ActionIcon({
  tip,
  icon,
  onClick,
  type = "button",
  tone = "default",
  disabled,
}: {
  tip: string;
  icon: ActionIconName;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "default" | "danger" | "gold" | "primary" | "success";
  disabled?: boolean;
}) {
  return (
    <Tip text={tip}>
      <button
        className={`icon-btn action-icon action-icon-${tone}`}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={tip}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d={ICONS[icon]} />
        </svg>
      </button>
    </Tip>
  );
}

type Place = { top: number; left: number; placement: "top" | "bottom" };

/** Ant Design–style confirm popover (portal + arrow + viewport clamp). */
export function ConfirmPopover({
  tip,
  icon = "delete",
  tone = "danger",
  title,
  message,
  confirmLabel,
  cancelLabel,
}: {
  tip: string;
  icon?: ActionIconName;
  tone?: "danger" | "gold" | "primary";
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [formId, setFormId] = useState<string>();
  const trigger = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useLayoutEffect(() => setReady(true), []);

  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const form = trigger.current.closest("form");
    if (!form) return;
    const id = form.id || `confirm-form-${panelId.replace(/:/g, "")}`;
    if (!form.id) form.id = id;
    setFormId(id);
  }, [open, panelId]);

  useLayoutEffect(() => {
    if (!open || !trigger.current || !panel.current) return;
    const triggerBox = trigger.current.getBoundingClientRect();
    const panelBox = panel.current.getBoundingClientRect();
    const margin = 10;
    const gap = 10;
    let placement: "top" | "bottom" = "bottom";
    let top = triggerBox.bottom + gap;
    if (top + panelBox.height > window.innerHeight - margin && triggerBox.top - gap - panelBox.height >= margin) {
      placement = "top";
      top = triggerBox.top - gap - panelBox.height;
    }
    let left = triggerBox.left + triggerBox.width / 2 - panelBox.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelBox.width - margin));
    setPlace({ top, left, placement });
  }, [open, title, message]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointer(event: PointerEvent) {
      const target = event.target as Node;
      if (trigger.current?.contains(target) || panel.current?.contains(target)) return;
      setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  return (
    <span className="confirm-pop" ref={trigger}>
      <ActionIcon tip={tip} icon={icon} tone={tone} onClick={() => setOpen((value) => !value)} />
      {ready && open
        ? createPortal(
            <div
              ref={panel}
              className={`antd-pop confirm-pop-panel${place ? ` is-${place.placement}` : ""}`}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              style={place ? { top: place.top, left: place.left } : { top: -9999, left: 0 }}
            >
              <span className="antd-pop-arrow" aria-hidden="true" />
              <strong className="antd-pop-title">{title}</strong>
              <div className="antd-pop-body note">{message}</div>
              <div className="row confirm-pop-actions">
                {/*
                  Portaled outside the form — use form=id so submit still posts the parent form.
                  Pending state from useFormStatus only works inside the form tree, so we mirror a simple busy via native disabled=false.
                */}
                <button
                  className={`btn btn-sm ${tone === "danger" ? "btn-danger" : "btn-primary"}`}
                  type="submit"
                  form={formId}
                >
                  {confirmLabel}
                </button>
                <button className="btn btn-ghost btn-sm" type="button" onClick={() => setOpen(false)}>
                  {cancelLabel ?? t("إلغاء", "Cancel")}
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
