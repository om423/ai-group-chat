# AI Group Chat with FacilitatorAgent

A real-time AI-powered group chat application featuring an intelligent FacilitatorAgent that responds only when needed, with policy-gated actions and comprehensive demo scenarios.

## 🚀 Features

### Core Functionality
- **Real-time Chat**: Socket.io-based messaging with live updates
- **FacilitatorAgent**: Intelligent AI that decides when to respond
- **Policy-Gated Actions**: Comprehensive authorization with permissive mode
- **LLM Integration**: OpenAI GPT-4o-mini for intelligent responses
- **Room Management**: Multi-room support with context awareness

### AI Capabilities
- **Implicit Triggers**: AI detects when users are asking for help
- **Explicit Triggers**: Force AI response with `@ai` or `/ai` commands
- **Smart Filtering**: Distinguishes between AI-directed and human-directed messages
- **Cooldown System**: Prevents AI spam with 20-second debounce
- **Context Awareness**: Uses recent conversation history for better responses

### Policy System
- **Permissive Mode**: Light policy enforcement for demos
- **RBAC/ABAC**: Role-based and attribute-based access control
- **Room Context**: Teacher presence affects AI permissions
- **Content Classification**: Restricted content handling
- **Real-time Tracing**: Policy decisions visible in UI

## 🏗️ Architecture

### Services
- **PDP** (port 4120): Policy Decision Point with Cedar policies
- **Agent** (port 4111): Core AI agent with FacilitatorAgent
- **Web** (port 3001): React/Next.js frontend with real-time UI

### Key Components
- **FacilitatorAgent**: Main AI logic with trigger detection
- **Chat State**: In-memory message storage with cooldown
- **Policy Engine**: Authorization with permissive/strict modes
- **Socket.io**: Real-time communication layer
- **LLM Decider**: Question classification and response generation

## 🛠️ Setup

### Prerequisites
- Node.js 20+
- pnpm
- OpenAI API key

### Installation
```bash
# Clone the repository
git clone https://github.com/om423/ai-group-chat.git
cd ai-group-chat

# Install dependencies
pnpm install

# Set up environment variables
echo "OPENAI_API_KEY=your_key_here" > apps/agent/.env
echo "POLICY_MODE=permissive" >> apps/agent/.env
```

### Running the Application
```bash
# Terminal 1: Start PDP service
cd apps/pdp && pnpm dev

# Terminal 2: Start Agent service
cd apps/agent && pnpm dev

# Terminal 3: Start Web UI
cd apps/web && pnpm dev -- -p 3001
```

## 🎯 Demo Scenarios

### Pitch Mode Features
- **Student Public → DENY**: Test policy restrictions
- **Student Private → ALLOW**: Test policy permissions
- **Teacher Public → ALLOW**: Test role-based access
- **Welcome Brief**: Test AI auto-responses
- **Context Toggle**: Test teacher presence effects

### Chat Scenarios
- **Question Detection**: "What is the time complexity of quicksort?" → AI responds
- **Team Messages**: "hey team, anyone free for standup?" → No AI response
- **Explicit Commands**: "@ai summarize the last 5 messages" → AI responds
- **Cooldown Test**: Multiple questions → AI respects 20s cooldown

## 🔧 Configuration

### Policy Modes
- **Permissive**: `POLICY_MODE=permissive` - Light enforcement, fast responses
- **Strict**: `POLICY_MODE=strict` - Full PDP evaluation with all rules

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-proj-...

# Optional
POLICY_MODE=permissive
PDP_URL=http://localhost:4120/authorize
NEXT_PUBLIC_MASTRA_BASE_URL=http://localhost:4111
```

## 📁 Project Structure

```
ai-group-chat/
├── apps/
│   ├── agent/          # Core AI agent service
│   │   ├── src/
│   │   │   ├── agents/     # FacilitatorAgent logic
│   │   │   ├── auth/       # Policy and authorization
│   │   │   ├── llm/        # LLM integration
│   │   │   ├── state/      # In-memory state management
│   │   │   ├── tools/      # Policy-gated tools
│   │   │   └── server.ts   # Express server
│   │   └── .env           # Environment configuration
│   ├── pdp/             # Policy Decision Point
│   │   ├── policies/    # Cedar policy files
│   │   └── src/         # PDP server
│   └── web/             # React/Next.js frontend
│       ├── src/
│       │   ├── app/     # Next.js app router
│       │   ├── components/ # React components
│       │   └── lib/     # Utility functions
│       └── public/      # Static assets
└── packages/
    └── shared/          # Shared types and utilities
```

## 🎮 Usage

1. **Start all services** (PDP, Agent, Web)
2. **Open browser** to http://localhost:3001
3. **Join a room** with any role (Student, Teacher, Analyst, etc.)
4. **Try chat scenarios**:
   - Ask questions → AI responds intelligently
   - Use `@ai` commands → Force AI response
   - Send team messages → No AI interference
5. **Watch Realtime Agent Actions** for policy decisions and traces
6. **Use Pitch Mode** for policy testing scenarios

## 🔍 Key Features Demonstrated

- **Intelligent AI Responses**: AI only responds when appropriate
- **Policy Integration**: All AI actions are policy-gated
- **Real-time Updates**: Live chat with Socket.io
- **Role-based Access**: Different permissions for different roles
- **Context Awareness**: Room state affects AI behavior
- **Demo Scenarios**: Comprehensive testing interface

## 🚀 Next Steps

- Add database persistence for messages
- Implement user authentication
- Add more AI agents and capabilities
- Enhance policy rules and scenarios
- Add file sharing and document analysis
- Implement room management UI

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Ready to demo!** The FacilitatorAgent provides intelligent, policy-gated responses in a real-time group chat environment.
