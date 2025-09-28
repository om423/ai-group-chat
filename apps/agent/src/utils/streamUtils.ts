/**
 * Utility functions for handling streaming responses
 */

export function handleTextStream(text: string, controller: ReadableStreamDefaultController) {
  const encoder = new TextEncoder();
  const data = `data: ${JSON.stringify({ type: 'text-delta', text })}\n\n`;
  controller.enqueue(encoder.encode(data));
}

export function streamJSONEvent(controller: ReadableStreamDefaultController, type: string, data: any) {
  const encoder = new TextEncoder();
  const eventData = `data: ${JSON.stringify({ type, data })}\n\n`;
  controller.enqueue(encoder.encode(eventData));
}

export function createSSEStream(handler: (controller: ReadableStreamDefaultController) => Promise<void>) {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial SSE headers
        controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));
        
        // Run the handler
        handler(controller).then(() => {
          controller.enqueue(encoder.encode('data: {"type":"end"}\n\n'));
          controller.close();
        }).catch((error) => {
          const errorData = `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        });
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
