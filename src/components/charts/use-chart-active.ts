"use client";

import { useCallback, useId, useState } from "react";

export function useChartActive(prefix = "chart") {
  const baseId = useId();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);

  const effective = pinnedKey ?? activeKey;

  const activate = useCallback((key: string | null) => {
    setActiveKey(key);
  }, []);

  const togglePin = useCallback((key: string) => {
    setPinnedKey((current) => (current === key ? null : key));
  }, []);

  const clear = useCallback(() => {
    setActiveKey(null);
  }, []);

  return {
    baseId,
    activeKey: effective,
    hoveredKey: activeKey,
    pinnedKey,
    activate,
    togglePin,
    clear,
    labelId: `${prefix}-${baseId}-label`,
    descId: `${prefix}-${baseId}-desc`,
    liveId: `${prefix}-${baseId}-live`,
  };
}
