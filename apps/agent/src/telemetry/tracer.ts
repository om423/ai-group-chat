type Trace = {
  ts: number;
  principal: { type: string; id: string; roles?: string[]; orgId?: string; name?: string };
  action: string;
  resource: any;
  context?: any;
  phase: "requested" | "pdp_decision" | "success" | "denied" | "error";
  decision?: "Allow" | "Deny";
  reason?: string;
  durationMs?: number;
  correlationId: string;
};

const MAX = 200;
const buf: Trace[] = [];

export const Tracer = {
  push(t: Trace) {
    buf.push(t);
    if (buf.length > MAX) buf.shift();
  },
  all() {
    return [...buf].reverse(); // newest first
  },
  reset() { 
    buf.length = 0; 
  }
};
