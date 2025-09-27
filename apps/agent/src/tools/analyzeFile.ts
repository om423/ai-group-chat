import { z } from "zod";
import { services } from "../services";
import { executeWithPolicy } from "../auth/pdp";
import { FileStore } from "../services/files";

const schema = z.object({
  fileId: z.string().min(1),
  roomId: z.string().min(1)
});
export type AnalyzeInput = z.infer<typeof schema>;
export const validateAnalyzeFile = (body: unknown) => schema.parse(body);

const impl = async ({ fileId }: AnalyzeInput) => {
  const file = FileStore.get(fileId);
  if (!file) throw new Error("file not found");
  const analysis = await services.doc.analyzeLocalFile(file.path);
  return { fileId, classification: file.classification, analysis };
};

export const execAnalyzeFile = executeWithPolicy<AnalyzeInput, Awaited<ReturnType<typeof impl>>>(
  "AnalyzeFile",
  (args) => {
    const file = FileStore.get(args.fileId);
    return { type: "File", id: args.fileId, roomId: file?.roomId, orgId: file?.orgId, classification: file?.classification };
  },
  (args) => {
    const file = FileStore.get(args.fileId);
    // For ABAC: indicate whether requesting principal is a member of the room (mock true for demo)
    return { roomMember: true, roomId: file?.roomId };
  }
);
export const analyzeFileImpl = impl;

