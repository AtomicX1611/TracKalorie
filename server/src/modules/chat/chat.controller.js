/**
 * chat.controller.js
 *
 * Handles POST /api/v1/chat
 * Thin controller — validates input, delegates to chatService, returns result.
 */

import { chatService } from './chat.service.js';
import { AppError } from '../../common/middleware/errorHandler.middleware.js';

export const chatController = {
  /**
   * POST /api/v1/chat
   *
   * Body: { messages: Array<{ role: 'user'|'assistant', content: string }> }
   *
   * The client always sends the full (or trimmed) conversation history.
   * The service trims to the last 20 messages internally to cap token usage.
   */
  async sendMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const timezone = req.timezone ?? 'UTC';

      const { messages } = req.body;

      // ── Input validation ──────────────────────────────────────────────────
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new AppError(400, 'BAD_REQUEST', 'messages must be a non-empty array');
      }

      // Validate each message has role + content
      for (const msg of messages) {
        if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
          throw new AppError(
            400, 'BAD_REQUEST',
            'Each message must have a role of "user" or "assistant"'
          );
        }
        if (typeof msg.content !== 'string' || !msg.content.trim()) {
          throw new AppError(400, 'BAD_REQUEST', 'Each message must have non-empty string content');
        }
      }

      // ── Run agent ─────────────────────────────────────────────────────────
      const { reply, actionsPerformed } = await chatService.run(userId, timezone, messages);

      res.json({
        data: {
          reply,
          actionsPerformed,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
