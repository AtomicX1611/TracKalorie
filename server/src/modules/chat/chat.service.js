/**
 * chat.service.js
 *
 * The core conversational AI agent for TracKalorie.
 *
 * Architecture: ReAct-style agent loop using OpenAI function calling.
 *   1. Build context-aware system prompt (user date, timezone, current goal).
 *   2. Send messages + tool definitions to GPT-4o.
 *   3. If the model calls tools → execute them, append results, loop.
 *   4. When the model produces a plain text response → return it.
 *
 * All business logic lives in the existing domain services.
 * This module is a thin orchestration layer.
 */

import OpenAI from 'openai';
import { config } from '../../common/config/config.js';
import { AppError } from '../../common/middleware/errorHandler.middleware.js';
import { mealsService } from '../meals/meals.service.js';
import { goalsService } from '../goals/goals.service.js';
import { nutritionService } from '../nutrition/nutrition.service.js';
import { CHAT_TOOLS } from './chat.tools.js';

// ── OpenAI client singleton (shared with ai.service.js pattern) ───────────────
let _openaiClient = null;
function getOpenAI() {
  if (!_openaiClient) {
    if (!config.openai.apiKey) {
      throw new AppError(503, 'AI_NOT_CONFIGURED', 'OpenAI API key is not configured');
    }
    _openaiClient = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return _openaiClient;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr(timezone) {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function sevenDaysAgoStr(timezone) {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  try {
    return d.toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

// ── System prompt factory ─────────────────────────────────────────────────────
function buildSystemPrompt(userId, timezone, today, currentGoal) {
  const goalContext = currentGoal
    ? `The user's current daily nutrition targets are:
  - Calories: ${currentGoal.dailyCalorieTarget} kcal
  - Protein:  ${currentGoal.proteinTargetG}g
  - Carbs:    ${currentGoal.carbTargetG}g
  - Fat:      ${currentGoal.fatTargetG}g${currentGoal.weightGoalKg ? `\n  - Weight goal: ${currentGoal.weightGoalKg} kg` : ''}`
    : 'The user has not set any nutrition goals yet. You can help them set one using the set_goal tool.';

  return `You are Kalorie, a friendly and knowledgeable AI nutrition assistant embedded in the TracKalorie app.

Today's date is ${today}. The user's timezone is ${timezone}.

${goalContext}

## Your capabilities
You can:
1. **Log meals** — when a user mentions eating something, immediately estimate the nutrition and call log_meal. Don't wait to be asked if the intent is clear.
2. **Summarise nutrition** — fetch today's or weekly totals and give clear, motivating feedback.
3. **Manage goals** — read and update daily calorie/macro targets on request.
4. **Answer nutrition questions** — provide factual information about any food.
5. **Delete meals** — only when the user explicitly asks.

## Behaviour guidelines
- Be concise, warm, and actionable. No lengthy disclaimers.
- When logging a meal, ALWAYS estimate nutrition yourself — never ask the user for calorie numbers.
- After logging a meal or setting a goal, confirm with a brief success message and show the key numbers (e.g. "✅ Logged 420 kcal lunch!").
- When summarising progress, include encouraging commentary.
- Use metric units (g, kcal) unless the user uses imperial.
- For meal type inference: morning/AM → breakfast, midday/noon → lunch, evening/PM → dinner, any time "snack" is mentioned → snack.
- Format numbers cleanly: no unnecessary decimal places for whole numbers.
- If the user asks something outside nutrition (general health, exercise, medical advice), politely redirect to nutrition topics.
- Today is ${today} — use this for all date calculations.

## Response format
- Use markdown for structure when helpful (bold for key numbers, bullet lists for meal items).
- Keep responses under 200 words unless a detailed summary is requested.
- Always end action confirmations with the key stat (e.g. "+420 kcal · 35g protein").`;
}

// ── Tool dispatcher ───────────────────────────────────────────────────────────
/**
 * Executes a single tool call from the LLM.
 * Returns a JSON-serialisable result that gets appended to the message thread.
 */
async function dispatchTool(toolName, args, userId, timezone) {
  const today = todayStr(timezone);
  const weekStart = sevenDaysAgoStr(timezone);

  switch (toolName) {
    // ── log_meal ─────────────────────────────────────────────────────────────
    case 'log_meal': {
      const meal = await mealsService.createMeal(userId, {
        mealType: args.mealType,
        date: args.date ?? today,
        timezone,
        items: args.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          calories: item.calories,
          macros: {
            proteinG: item.macros.proteinG,
            carbG: item.macros.carbG,
            ...(item.macros.fatG === undefined ? {} : { fatG: item.macros.fatG }),
          },
        })),
        source: 'manual',
      });
      return {
        success: true,
        mealId: meal._id,
        mealType: meal.mealType,
        date: meal.date,
        totals: meal.totals,
        itemCount: meal.items.length,
      };
    }

    // ── list_meals ──────────────────────────────────────────────────
    case 'list_meals': {
      const result = await mealsService.listMeals(userId, {
        from: args.from ?? today,
        to: args.to ?? today,
        mealType: args.mealType,
        limit: 20,
      });
      // mealsService returns { meals, nextCursor } (raw repo shape)
      const meals = result.meals ?? [];
      return {
        meals: meals.map((m) => ({
          id: m._id,
          mealType: m.mealType,
          date: m.date,
          totals: m.totals,
          items: m.items.map((i) => ({ name: i.name, calories: i.calories })),
        })),
        count: meals.length,
      };
    }

    // ── get_today_summary ─────────────────────────────────────────────────────
    case 'get_today_summary': {
      const date = args.date ?? today;
      const [mealsResult, goal] = await Promise.all([
        mealsService.listMeals(userId, { from: date, to: date, limit: 50 }),
        goalsService.getCurrentGoal(userId),
      ]);
      // mealsService returns { meals, nextCursor } — NOT { data }
      const meals = mealsResult.meals ?? [];
      const totals = meals.reduce(
        (acc, m) => ({
          calories: acc.calories + m.totals.calories,
          proteinG: acc.proteinG + m.totals.proteinG,
          carbG: acc.carbG + m.totals.carbG,
          fatG: acc.fatG + m.totals.fatG,
        }),
        { calories: 0, proteinG: 0, carbG: 0, fatG: 0 }
      );
      return {
        date,
        totals,
        goal: goal
          ? {
              dailyCalorieTarget: goal.dailyCalorieTarget,
              proteinTargetG: goal.proteinTargetG,
              carbTargetG: goal.carbTargetG,
              fatTargetG: goal.fatTargetG,
            }
          : null,
        remaining: goal
          ? {
              calories: Math.max(goal.dailyCalorieTarget - totals.calories, 0),
              proteinG: Math.max(goal.proteinTargetG - totals.proteinG, 0),
            }
          : null,
        mealCount: meals.length,
        meals: meals.map((m) => ({ mealType: m.mealType, calories: m.totals.calories })),
      };
    }

    // ── get_weekly_summary ────────────────────────────────────────────────────
    case 'get_weekly_summary': {
      const from = args.from ?? weekStart;
      const to = args.to ?? today;
      const [trend, goalVsActual] = await Promise.all([
        nutritionService.getWeeklyTrend(userId, from, to, timezone),
        nutritionService.getGoalVsActual(userId, from, to, timezone).catch(() => null),
      ]);
      const avgCalories =
        trend.length > 0
          ? Math.round(trend.reduce((s, d) => s + d.calories, 0) / trend.length)
          : 0;
      return {
        from,
        to,
        dailyData: trend,
        averageCaloriesPerDay: avgCalories,
        goalVsActual: goalVsActual ?? null,
        daysTracked: trend.length,
      };
    }

    // ── get_current_goal ──────────────────────────────────────────────────────
    case 'get_current_goal': {
      const goal = await goalsService.getCurrentGoal(userId);
      if (!goal) return { goal: null, message: 'No goal set yet.' };
      return {
        goal: {
          dailyCalorieTarget: goal.dailyCalorieTarget,
          proteinTargetG: goal.proteinTargetG,
          carbTargetG: goal.carbTargetG,
          fatTargetG: goal.fatTargetG,
          weightGoalKg: goal.weightGoalKg ?? null,
          effectiveFrom: goal.effectiveFrom,
        },
      };
    }

    // ── set_goal ──────────────────────────────────────────────────────────────
    case 'set_goal': {
      const newGoal = await goalsService.createGoal(userId, {
        dailyCalorieTarget: args.dailyCalorieTarget,
        proteinTargetG: args.proteinTargetG,
        carbTargetG: args.carbTargetG,
        ...(args.fatTargetG === undefined ? {} : { fatTargetG: args.fatTargetG }),
        weightGoalKg: args.weightGoalKg,
      });
      return {
        success: true,
        goal: {
          dailyCalorieTarget: newGoal.dailyCalorieTarget,
          proteinTargetG: newGoal.proteinTargetG,
          carbTargetG: newGoal.carbTargetG,
          fatTargetG: newGoal.fatTargetG,
          weightGoalKg: newGoal.weightGoalKg ?? null,
        },
      };
    }

    // ── get_nutrition_info ────────────────────────────────────────────────────
    case 'get_nutrition_info': {
      // We use GPT-4o's own knowledge here — no external lookup needed.
      // Return a structured prompt result to the agent thread.
      return {
        query: args.food,
        note: 'Use your nutritional knowledge to answer this query. Provide estimates in kcal, protein (g), carbs (g), fat (g) per the specified serving.',
      };
    }

    // ── delete_meal ───────────────────────────────────────────────────────────
    case 'delete_meal': {
      await mealsService.deleteMeal(userId, args.mealId);
      return { success: true, deletedMealId: args.mealId };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ── Agent loop ────────────────────────────────────────────────────────────────
const MAX_ITERATIONS = 6; // safety cap on tool-call loops

export const chatService = {
  /**
   * Run the agent loop for a user turn.
   *
   * @param {string}   userId      - Authenticated user's Mongo _id (as string)
   * @param {string}   timezone    - IANA timezone from X-Timezone header
   * @param {Array}    messages    - OpenAI-format message history from the client
   *                                 [{ role: 'user'|'assistant', content: string }]
   * @returns {{ reply: string, actionsPerformed: Array }}
   */
  async run(userId, timezone, messages) {
    const openai = getOpenAI();
    const today = todayStr(timezone);

    // Load current goal for system prompt context
    let currentGoal = null;
    try {
      currentGoal = await goalsService.getCurrentGoal(userId);
    } catch {
      // Non-fatal — the agent can still function without a goal
    }

    const systemPrompt = buildSystemPrompt(userId, timezone, today, currentGoal);

    // Build the thread: system + history (last 20 messages to cap token usage)
    const MAX_HISTORY = 20;
    const trimmedHistory = messages.slice(-MAX_HISTORY);
    const thread = [
      { role: 'system', content: systemPrompt },
      ...trimmedHistory,
    ];

    const actionsPerformed = [];
    let iterations = 0;

    // ── Main loop ─────────────────────────────────────────────────────────────
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      let response;
      try {
        response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: thread,
          tools: CHAT_TOOLS,
          tool_choice: 'auto',
          temperature: 0.4,
          max_tokens: 1024,
        });
      } catch (err) {
        throw new AppError(502, 'AI_PROVIDER_UNAVAILABLE', 'AI provider request failed');
      }

      const choice = response.choices[0];
      const assistantMessage = choice.message;

      // Append assistant message to thread
      thread.push(assistantMessage);

      // ── No tool calls → we're done ───────────────────────────────────────
      if (choice.finish_reason === 'stop' || !assistantMessage.tool_calls?.length) {
        return {
          reply: assistantMessage.content ?? 'I apologize, I could not generate a response.',
          actionsPerformed,
        };
      }

      // ── Execute all tool calls in this response ───────────────────────────
      const toolResults = await Promise.allSettled(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const toolName = toolCall.function.name;
          let args;
          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            return { toolCallId: toolCall.id, toolName, error: 'Failed to parse tool arguments' };
          }

          let result;
          try {
            result = await dispatchTool(toolName, args, userId, timezone);
          } catch (err) {
            result = {
              error: err instanceof AppError ? err.message : 'Tool execution failed',
              code: err instanceof AppError ? err.code : 'TOOL_ERROR',
            };
          }

          // Track successfully completed action tools for the client
          if (result.success) {
            actionsPerformed.push({ tool: toolName, result });
          }

          return { toolCallId: toolCall.id, toolName, result };
        })
      );

      // Append all tool results to the thread
      for (const settled of toolResults) {
        if (settled.status === 'fulfilled') {
          const { toolCallId, result } = settled.value;
          thread.push({
            role: 'tool',
            tool_call_id: toolCallId,
            content: JSON.stringify(result),
          });
        }
      }
    }

    // Fallback if we hit the iteration cap
    return {
      reply: "I've processed your request but hit the complexity limit. Could you try a simpler question?",
      actionsPerformed,
    };
  },
};
