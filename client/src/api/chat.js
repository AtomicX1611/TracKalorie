import api from './client'

/**
 * chatApi — thin wrapper for the POST /api/v1/chat endpoint.
 *
 * The client owns the conversation history and sends it with every request.
 * The server is stateless with respect to chat.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages
 * @returns {Promise<{ reply: string, actionsPerformed: Array }>}
 */
export const chatApi = {
  send: (messages) =>
    api.post('/chat', { messages }).then((r) => r.data.data),
}
