import type { Principal } from "../auth/principal";

// For now we just pass through the given agent principal.
// This file exists so later you can map user sessions to principals per message.
export function getPrincipalFromMsg(p: Principal): Principal { return p; }

