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

  return (
    <span
      ref={host}
      className={className ? `tip-host ${className}` : "tip-host"}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setOpen(false); setPlace(null); }}
      onFocus={() => setOpen(true)}
      onBlur={() => { setOpen(false); setPlace(null); }}
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
