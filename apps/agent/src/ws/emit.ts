// tiny module to share io instance
import type { Server as IOServer } from "socket.io";
import { AgentMessages } from "../state/messages";

let _io: IOServer | null = null;
export function setIO(io: IOServer) { _io = io; }
export function ioEmit(ev: string, data: any) { 
  if (ev === "agent:message") AgentMessages.push(data);
  _io?.emit(ev, data); 
}
