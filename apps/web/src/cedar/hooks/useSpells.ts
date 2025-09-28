import { useMemo } from "react";
import { spells } from "../spells/index";

export function useSpells() {
  // In a real app you could filter by role/policy here
  return useMemo(() => spells, []);
}
