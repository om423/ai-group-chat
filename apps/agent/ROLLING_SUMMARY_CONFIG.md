# Rolling Summary Configuration

## Environment Variables

Add these environment variables to your `.env` file in the agent directory:

```bash
# Rolling Summary Configuration
ROLLING_SUMMARY_INTERVAL=10      # Number of user messages before triggering summary
ROLLING_SUMMARY_MIN_MS=45000     # Minimum time between summaries (45 seconds)

# Existing Summarizer Configuration (optional overrides)
SUMMARIZER_THRESHOLD=25          # Legacy threshold (now uses ROLLING_SUMMARY_INTERVAL)
SUMMARIZER_COOLDOWN_MS=60000     # Legacy cooldown (now uses ROLLING_SUMMARY_MIN_MS)
SUMMARIZER_WINDOW=40             # Number of messages to include in summary
```

## How It Works

1. **Message Counting**: Only user messages count toward the rolling summary trigger
2. **Automatic Triggering**: Every 10 user messages (configurable), a summary is generated
3. **Cooldown Protection**: Minimum 45 seconds between summaries to prevent spam
4. **Action Integration**: Uses the existing `summarizeWindow` action through the PDP system
5. **UI Updates**: Summary appears in the Summary tab in the right panel

## Testing

1. Send 10 user messages in a room
2. Check the Summary tab for the generated summary
3. Send another 10 messages quickly - no summary until 45 seconds have passed
4. After cooldown, send more messages to trigger the next summary

## Notes

- Agent messages don't count toward the trigger
- Summaries are posted as agent messages in the chat
- Policy traces show ALLOW decisions for summary actions
- Configuration is per-agent-instance (in-memory)
