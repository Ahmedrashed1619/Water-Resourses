"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Place = { left: number; top: number };

export function Tip({ text, children, className }: { text: string; children: React.ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const suppressUntil = useRef(0);

  function show() {
    if (Date.now() < suppressUntil.current) return;
    setOpen(true);
  }

  function hide() {
    setOpen(false);
    setPlace(null);
  }

  function dismiss() {
    suppressUntil.current = Date.now() + 400;
    hide();
  }

  useLayoutEffect(() => setReady(true), []);

  useLayoutEffect(() => {
    if (!open || !host.current || !tip.current) return;
    const hostNode = host.current;
    const tipNode = tip.current;
    function placeTip() {
      const box = hostNode.getBoundingClientRect();
      const tipBox = tipNode.getBoundingClientRect();
      const margin = 12;
      let left = box.left + box.width / 2 - tipBox.width / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - tipBox.width - margin));
      const above = box.top - tipBox.height - 8;
      const top = above < margin ? Math.min(box.bottom + 8, window.innerHeight - tipBox.height - margin) : above;
      setPlace({ left, top });
    }
    placeTip();
    window.addEventListener("scroll", placeTip, true);
    window.addEventListener("resize", placeTip);
    return () => {
      window.removeEventListener("scroll", placeTip, true);
      window.removeEventListener("resize", placeTip);
    };
  }, [open, text]);

  useLayoutEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") hide();
    }
    function onPointerDown(event: PointerEvent) {
      if (host.current?.contains(event.target as Node)) return;
      hide();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open]);

  return (
    <span
      ref={host}
      className={className ? `tip-host ${className}` : "tip-host"}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(event) => {
        if (host.current?.contains(event.relatedTarget as Node)) return;
        hide();
      }}
      onPointerDown={dismiss}
      onClick={dismiss}
    >
      {children}
      {ready && open
        ? createPortal(
            <span ref={tip} className="tip-float" style={place ?? { left: -9999, top: 0 }} role="tooltip">{text}</span>,
            document.body,
          )
        : null}
    </span>
  );
}
