import fs from "node:fs";
import path from "node:path";
import { isAuthorized, PolicySet, Schema, AuthorizationCall, Entities } from "@cedar-policy/cedar-wasm/nodejs";

const POLICY_DIR = process.env.CEDAR_POLICY_DIR || path.resolve(process.cwd(), "policies");
const SCHEMA_PATH = process.env.CEDAR_SCHEMA || path.resolve(process.cwd(), "schema.cedarschema.json");

function loadPolicyFiles(dir: string) {
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".cedar"))
    .map(f => ({ id: f, contents: fs.readFileSync(path.join(dir, f), "utf8") })); // <-- strings
}

export function loadAuthorizer() {
  // Try without schema entirely to see if policies work
  const policies: PolicySet = { staticPolicies: [] };
  const entities: Entities = []; // Empty entities for now

  return {
    isAuthorized: (principal: any, action: string, resource: any, context: any = {}) => {
      const call: AuthorizationCall = {
        principal,
        action: { type: "Action", id: action },
        resource,
        context: context || {},
        policies,
        entities
        // schema: undefined // Try without schema entirely
      };
      return isAuthorized(call);
    }
  };
}