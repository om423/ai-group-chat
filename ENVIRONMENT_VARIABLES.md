# Environment Variables Configuration

## Web App (apps/web)

### Required Variables
- `NEXT_PUBLIC_MASTRA_BASE_URL` - Base URL for the agent backend (default: http://localhost:4111)

### Welcome Brief Configuration
- `NEXT_PUBLIC_WELCOME_BRIEF_K` - Number of messages to consider when generating welcome brief (default: 40)

## Agent Backend (apps/agent)

### Welcome Brief Configuration
- `WELCOME_BRIEF_MIN_MS` - Minimum time in milliseconds between welcome briefs for the same user/room combination (default: 180000 = 3 minutes)

### Other Agent Configuration
- `MONGODB_URI` - MongoDB connection string (default: mongodb://localhost:27017)
- `PDP_URL` - Policy Decision Point URL (default: http://localhost:4120/authorize)
- `POLICY_MODE` - Set to "permissive" for permissive policy mode
- `FACILITATOR_ENABLED` - Enable facilitator agent (default: true)
- `SUMMARIZER_ENABLED` - Enable summarizer agent (default: true)
- `SUMMARIZER_WINDOW` - Number of messages to consider for summarization (default: 40)
- `SUMMARIZER_THRESHOLD` - Minimum messages before triggering summary (default: 25)
- `SUMMARIZER_COOLDOWN_MS` - Cooldown between summaries (default: 60000)
- `SUMMARIZER_MODEL` - LLM model for summarization (default: gpt-4o-mini)

## Usage Examples

### Development (.env.local for web app)
```bash
NEXT_PUBLIC_MASTRA_BASE_URL=http://localhost:4111
NEXT_PUBLIC_WELCOME_BRIEF_K=40
```

### Development (.env for agent)
```bash
MONGODB_URI=mongodb://localhost:27017
WELCOME_BRIEF_MIN_MS=180000
SUMMARIZER_WINDOW=40
POLICY_MODE=permissive
```
