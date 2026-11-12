"use client";

import { createContext, useContext } from "react";
import { DEFAULT_NAV, type SiteNav } from "./nav-data";

export { DEFAULT_NAV, asIcon, pillFor, type SiteNav } from "./nav-data";

const NavContext = createContext<SiteNav>(DEFAULT_NAV);

export function SiteNavProvider({
  value,
  children,
}: {
  value: SiteNav;
  children: React.ReactNode;
}) {
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useSiteNav() {
  return useContext(NavContext);
}
