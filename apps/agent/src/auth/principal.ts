import type { Request } from "express";

export type Principal =
  | { type: "User"; id: string; orgId?: string; roles?: string[] }
  | { type: "Agent"; id: string; orgId?: string; name?: string };

export function getPrincipalFromReq(req: Request): Principal {
  // Lightweight mock: send headers from the web client for now.
  // x-principal-type: "User" | "Agent"
  // x-user-id / x-agent-id
  // x-org-id
  // x-roles: comma-separated (e.g., "Teacher,Analyst")
  const pType = (req.header("x-principal-type") || "Agent") as "User" | "Agent";
  const orgId = req.header("x-org-id") || "org-1";

  if (pType === "User") {
    const id = req.header("x-user-id") || "u-student";
    const rolesRaw = req.header("x-roles") || "Student";
    const roles = rolesRaw.split(",").map(s => s.trim()).filter(Boolean);
    const principal = { type: "User", id, orgId, roles };
    console.log(`[agent] Extracted User principal:`, JSON.stringify(principal, null, 2));
    return principal;
  } else {
    const id = req.header("x-agent-id") || "facilitator";
    const name = req.header("x-agent-name") || "FacilitatorAgent";
    const principal = { type: "Agent", id, orgId, name };
    console.log(`[agent] Extracted Agent principal:`, JSON.stringify(principal, null, 2));
    return principal;
  }
}
