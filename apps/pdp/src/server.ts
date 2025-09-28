import "dotenv/config";
import express from "express";

const PORT = 4120;
const app = express();
app.use(express.json());

// TEMPORARY: Remove Cedar import to avoid WASM issues
// const authorizer = loadAuthorizer();

function getDenyReason(principal: any, action: string, resource: any, context: any): string {
  if (action === "CreateThread") {
    if (principal.type === "User" && !principal.roles?.includes("Teacher") && !principal.roles?.includes("Student")) {
      return "Only Teachers and Students can create threads";
    } else if (principal.type === "Agent" && (!resource.teacherPresent || context.visibility !== "public")) {
      return "Agents can only create public threads when teacher is present";
    }
  } else if (action === "Summarize") {
    if (principal.type === "User" && !principal.roles?.includes("Teacher") && !principal.roles?.includes("Analyst") && !principal.roles?.includes("Researcher")) {
      return "Only Teachers, Analysts, and Researchers can summarize";
    }
  } else if (action === "AnalyzeFile") {
    if (principal.roles?.includes("Student") && resource.classification === "restricted") {
      return "Students cannot analyze restricted files";
    } else if (principal.roles?.includes("Student") && !context.roomMember) {
      return "Students can only analyze files in rooms they are members of";
    } else if (!principal.roles?.includes("Teacher") && !principal.roles?.includes("Analyst") && !principal.roles?.includes("Researcher") && !principal.roles?.includes("Student")) {
      return "Only Teachers, Analysts, Researchers, and Students can analyze files";
    }
  } else if (action === "LabelMessage") {
    if (context.classification === "restricted") {
      return "Cannot label restricted content";
    }
  } else if (action === "PostAsAgent") {
    if (principal.type !== "Agent") {
      return "Only Agents can post as agent";
    } else if (!resource.teacherPresent) {
      return "Agents can only post when teacher is present";
    }
  }
  return "No matching policy rule";
}

app.post("/authorize", async (req, res) => {
  try {
    const { principal, action, resource, context } = req.body;
    
    // TEMPORARY MOCK: Simulate Cedar policy evaluation
    // This demonstrates the complete system working while we resolve the Cedar WASM issue
    
    console.log(`[pdp] Mock evaluation: ${principal.type} ${action} on ${resource.type}`);
    
    // Mock policy logic based on our RBAC/ABAC rules
    let decision = "Deny";
    
    if (action === "CreateThread") {
      if (principal.type === "Agent" && resource.teacherPresent === true && context.visibility === "public") {
        decision = "Allow"; // Agent can create public threads when teacher is present
      } else if (principal.type === "User" && principal.roles?.includes("Teacher")) {
        decision = "Allow"; // Teachers can create threads
      } else if (principal.type === "User" && principal.roles?.includes("Student")) {
        decision = "Allow"; // Students can create both private and public threads
      }
    } else if (action === "Summarize") {
      if (principal.type === "Agent" || principal.roles?.includes("Teacher") || principal.roles?.includes("Analyst")) {
        decision = "Allow"; // Agents, Teachers, and Analysts can summarize
      }
    } else if (action === "AnalyzeFile") {
      if (principal.roles?.includes("Teacher") || principal.roles?.includes("Analyst") || principal.roles?.includes("Researcher")) {
        decision = "Allow"; // Teachers, Analysts, Researchers can analyze files
      } else if (principal.roles?.includes("Student") && context.roomMember === true && resource.classification !== "restricted") {
        decision = "Allow"; // Students can analyze non-restricted files when room member
      }
    } else if (action === "LabelMessage") {
      if (context.classification !== "restricted") {
        decision = "Allow"; // Labeling allowed only for non-restricted content
      }
    } else if (action === "PostAsAgent") {
      if (principal.type === "Agent" && resource.teacherPresent === true) {
        decision = "Allow"; // Agents can post when teacher is present
      }
    }
    
    // Debug: log what we received
    console.log(`[pdp] Received: principal=${JSON.stringify(principal)}, action=${action}, resource=${JSON.stringify(resource)}, context=${JSON.stringify(context)}`);
    
    res.json({ 
      decision, 
      reason: decision === "Allow" ? `Mock policy evaluation: ${decision}` : `Mock policy evaluation: ${decision} - ${getDenyReason(principal, action, resource, context)}`,
      diagnostics: { 
        reason: decision === "Allow" ? `Mock policy evaluation: ${decision}` : `Mock policy evaluation: ${decision} - ${getDenyReason(principal, action, resource, context)}`,
        policies: ["Mock RBAC/ABAC policies active"]
      } 
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ decision: "Deny", error: e.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`[pdp] Cedar PDP listening on :${PORT}`));