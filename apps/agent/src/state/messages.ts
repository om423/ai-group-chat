type AgentMsg = { roomId: string; text: string; ts: number };
const _msgs: AgentMsg[] = [];

export const AgentMessages = {
  push(m: AgentMsg) { 
    _msgs.unshift(m); 
    if (_msgs.length > 200) _msgs.pop(); 
  },
  all() { 
    return [..._msgs]; 
  },
  reset() { 
    _msgs.length = 0; 
  }
};

