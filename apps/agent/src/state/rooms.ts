type RoomCtx = { id: string; orgId: string; teacherPresent: boolean };

const _rooms = new Map<string, RoomCtx>();

// Seed default room
_rooms.set("r1", { id: "r1", orgId: "org-1", teacherPresent: true });

export const Rooms = {
  get(id: string) {
    if (!_rooms.has(id)) _rooms.set(id, { id, orgId: "org-1", teacherPresent: false });
    return _rooms.get(id)!;
  },
  setTeacherPresent(id: string, teacherPresent: boolean) {
    const r = Rooms.get(id);
    r.teacherPresent = teacherPresent;
    _rooms.set(id, r);
    return r;
  },
  all() {
    return Array.from(_rooms.values());
  }
};

