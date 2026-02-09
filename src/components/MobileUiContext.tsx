"use client";

import { createContext, useContext } from "react";

type MobileUi = {
  openMenu: () => void;
};

const Ctx = createContext<MobileUi | null>(null);

export function MobileUiProvider({
  value,
  children,
}: {
  value: MobileUi;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMobileUi() {
  const v = useContext(Ctx);
  if (!v) {
    return {
      openMenu: () => {},
    } as MobileUi;
  }
  return v;
}
