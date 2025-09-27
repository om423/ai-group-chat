type StoredFile = {
  id: string;
  roomId: string;
  orgId: string;
  filename: string;
  mime: string;
  classification: "public" | "internal" | "restricted";
  path: string; // local temp path
};

const _files = new Map<string, StoredFile>();

export const FileStore = {
  put(f: StoredFile) { _files.set(f.id, f); return f; },
  get(id: string) { return _files.get(id) || null; }
};

