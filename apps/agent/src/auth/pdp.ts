import "dotenv/config";
import fetch from "node-fetch";
import type { Principal } from "./principal";

const PDP_URL = process.env.PDP_URL ?? "http://localhost:4120/authorize";
const PERMISSIVE = process.env.POLICY_MODE === "permissive";

export type PDPInput = {
  principal: Principal;
  action: string;
  resource: { type: string; id: string; [k: string]: any };
  context?: Record<string, any>;
};

export async function authorize(input: PDPInput) {
  if (PERMISSIVE) {
    // Minimal checks you still want:
    // 1) must have a roomId for Room actions
    // 2) block LabelMessage when classification is "restricted"
    if (input.action === "LabelMessage" && input.context?.classification === "restricted") {
      return { decision: "Deny", reason: "restricted-content" } as const;
    }
    return { decision: "Allow" } as const;
  }

  // Normal path → call real PDP:
  console.log(`[agent] Calling PDP with:`, JSON.stringify(input, null, 2));
  const res = await fetch(PDP_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`PDP error: ${res.status}`);
  const data = (await res.json()) as { decision: "Allow" | "Deny"; reason?: string; diagnostics?: any };
  console.log(`[agent] PDP response:`, JSON.stringify(data, null, 2));
  return {
    decision: data.decision,
    reason: data.reason ?? data.diagnostics?.reason ?? "no-reason"
  };
}

// New: "executor" that receives principal per call
export function executeWithPolicy<TArgs extends object, TRes>(
  actionName: string,
  buildResource: (args: TArgs) => PDPInput["resource"],
  buildContext?: (args: TArgs) => PDPInput["context"]
) {
  return async (principal: Principal, fn: (args: TArgs) => Promise<TRes>, args: TArgs): Promise<TRes> => {
    const resource = buildResource(args);
    const context = buildContext ? buildContext(args) : undefined;
    console.log(`[agent] Policy check for ${actionName}:`, { principal, resource, context });
    const decision = await authorize({ principal, action: actionName, resource, context });
    console.log(`[agent] Policy decision:`, decision);
    if (decision.decision !== "Allow") {
      const reason = decision.reason || "denied-by-policy";
      throw new Error(`Unauthorized by policy: ${reason}`);
    }
    return fn(args);
  };
}
