import type { MessageStreamParams } from '@anthropic-ai/sdk/resources/messages/messages';
import { anthropic } from './anthropic';

export function streamAnthropicResponse(params: MessageStreamParams): Response {
  const stream = anthropic.messages.stream(params);

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        console.error('[stream-anthropic] error:', err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
