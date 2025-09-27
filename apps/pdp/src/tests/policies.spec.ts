import { describe, it, expect, beforeAll } from "vitest";
import { loadAuthorizer } from "../cedar";

let auth: ReturnType<typeof loadAuthorizer>;

beforeAll(() => { auth = loadAuthorizer(); });

function decide(principal: any, action: string, resource: any, context: any = {}) {
  const result = auth.isAuthorized(principal, action, resource, context);
  if (result.type === "success") {
    return result.response.decision;
  } else {
    throw new Error(`Authorization failed: ${result.errors}`);
  }
}

describe("Cedar policies", () => {
  const Teacher = { type: "User", id: "u-teacher", orgId: "org-1", roles: new Set(["Teacher"]) };
  const Student = { type: "User", id: "u-student", orgId: "org-1", roles: new Set(["Student"]) };
  const Agent   = { type: "Agent", id: "facilitator", orgId: "org-1", name: "FacilitatorAgent" };

  const RoomWithTeacher = { type: "Room", id: "r1", orgId: "org-1", members: new Set([Student]), teacherPresent: true };
  const RoomNoTeacher   = { type: "Room", id: "r2", orgId: "org-1", members: new Set([Student]), teacherPresent: false };
  const Msg             = { type: "Message", id: "m1", roomId: "r1", authorId: "u-student" };

  it("Teacher can CreateThread public", () => {
    expect(decide(Teacher, "CreateThread", RoomWithTeacher, { visibility: "public" })).toBe("Allow");
  });

  it("Student denied CreateThread public", () => {
    expect(decide(Student, "CreateThread", RoomWithTeacher, { visibility: "public" })).toBe("Deny");
  });

  it("Student allowed CreateThread private when member", () => {
    expect(decide(Student, "CreateThread", RoomWithTeacher, { visibility: "private" })).toBe("Allow");
  });

  it("Agent allowed CreateThread public only if teacherPresent", () => {
    expect(decide(Agent, "CreateThread", RoomWithTeacher, { visibility: "public" })).toBe("Allow");
    expect(decide(Agent, "CreateThread", RoomNoTeacher,   { visibility: "public" })).toBe("Deny");
  });

  it("Moderator rule: LabelMessage denied when restricted", () => {
    expect(decide(Teacher, "LabelMessage", Msg, { classification: "restricted" })).toBe("Deny");
  });

        it("Moderator rule: LabelMessage allowed when not restricted", () => {
          expect(decide(Teacher, "LabelMessage", Msg, { classification: "internal" })).toBe("Allow");
        });

        it("Teacher can AnalyzeFile (org-scoped)", () => {
          const Teacher = { type: "User", id: "u-teacher", orgId: "org-1", roles: ["Teacher"] };
          const FilePub = { type: "File", id: "f1", roomId: "r1", orgId: "org-1", classification: "internal" };
          expect(decide(Teacher, "AnalyzeFile", FilePub, {})).toBe("Allow");
        });

        it("Student AnalyzeFile denied when restricted", () => {
          const Student = { type: "User", id: "u-student", orgId: "org-1", roles: ["Student"] };
          const FileR   = { type: "File", id: "f2", roomId: "r1", orgId: "org-1", classification: "restricted" };
          expect(decide(Student, "AnalyzeFile", FileR, { roomMember: true })).toBe("Deny");
        });

        it("Student AnalyzeFile allowed when member and not restricted", () => {
          const Student = { type: "User", id: "u-student", orgId: "org-1", roles: ["Student"] };
          const FileI   = { type: "File", id: "f3", roomId: "r1", orgId: "org-1", classification: "internal" };
          expect(decide(Student, "AnalyzeFile", FileI, { roomMember: true })).toBe("Allow");
        });
      });
