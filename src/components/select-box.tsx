"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type SelectOption = { value: string; label: string };

export function SelectBox({
  name,
  value,
  defaultValue = "",
  options,
  required,
  compact = false,
  onChange,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: SelectOption[];
  required?: boolean;
  compact?: boolean;
  onChange?: (value: string) => void;
}) {
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const current = controlled ? value : inner;
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<{ left: number; top: number; width: number; up: boolean } | null>(null);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const label = options.find((option) => option.value === current)?.label ?? "";

  useLayoutEffect(() => setReady(true), []);

  useLayoutEffect(() => {
    if (!open || !root.current || !menu.current) return;
    const rootNode = root.current;
    const menuNode = menu.current;
    function placeMenu() {
      const box = rootNode.getBoundingClientRect();
      const menuBox = menuNode.getBoundingClientRect();
      const margin = 8;
      const spaceBelow = window.innerHeight - box.bottom;
      const up = spaceBelow < menuBox.height + margin && box.top > menuBox.height + margin;
      const width = Math.max(box.width, 160);
      let left = box.left;
      left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
      const top = up ? box.top - menuBox.height - 6 : box.bottom + 6;
      setPlace({ left, top, width, up });
    }
    placeMenu();
    window.addEventListener("scroll", placeMenu, true);
    window.addEventListener("resize", placeMenu);
    return () => {
      window.removeEventListener("scroll", placeMenu, true);
      window.removeEventListener("resize", placeMenu);
    };
  }, [open, options]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (root.current?.contains(target) || menu.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(next: string) {
    if (!controlled) setInner(next);
    onChange?.(next);
    setOpen(false);
  }

  return (
    <div className={compact ? "selectbox compact" : "selectbox"} ref={root}>
      {name ? <input type="hidden" name={name} value={current} required={required} /> : null}
      <button className="selectbox-btn" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{label}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {ready && open
        ? createPortal(
            <ul
              ref={menu}
              className="selectbox-menu"
              role="listbox"
              style={place ? { left: place.left, top: place.top, width: place.width } : { left: -9999, top: 0, width: 160 }}
            >
              {options.map((option) => (
                <li key={option.value || "empty"}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === current}
                    className={option.value === current ? "is-selected" : undefined}
                    onClick={() => pick(option.value)}
                  >
                    <span>{option.label}</span>
                    {option.value === current ? <i aria-hidden="true" /> : null}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
