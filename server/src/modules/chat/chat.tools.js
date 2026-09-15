/**
 * chat.tools.js
 *
 * OpenAI function-calling tool definitions for the TracKalorie chat agent.
 * Each entry is passed verbatim to the `tools` array in the completions call.
 *
 * Design: keep descriptions user-intent-focused (what the tool does for the
 * user) rather than implementation-focused.  GPT-4o uses these descriptions
 * to decide which tool to call.
 */

export const CHAT_TOOLS = [
  // ── Meal logging ────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'log_meal',
      description:
        'Log / record a meal the user just ate or wants to track. ' +
        'Use this whenever the user mentions eating, logging, adding, or recording food. ' +
        'You MUST infer reasonable calorie and macro estimates for the food items if the user does not provide them — ' +
        'do NOT ask the user for numbers; just estimate them from nutritional knowledge and call the tool.',
      parameters: {
        type: 'object',
        properties: {
          mealType: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'The type of meal. Infer from context (e.g. "morning" → breakfast).',
          },
          date: {
            type: 'string',
            description:
              'The calendar date for this meal in YYYY-MM-DD format. ' +
              'Use today\'s date unless the user says otherwise.',
          },
          items: {
            type: 'array',
            description: 'List of food items in this meal.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Food name, e.g. "Grilled Chicken Breast"' },
                quantity: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', description: 'Numeric quantity, e.g. 1.5' },
                    unit:   { type: 'string', description: 'Unit, e.g. "cup", "g", "oz", "piece"' },
                  },
                  required: ['amount', 'unit'],
                },
                calories: { type: 'number', description: 'Estimated calories for this item.' },
                macros: {
                  type: 'object',
                  properties: {
                    proteinG: { type: 'number' },
                    carbG:    { type: 'number' },
                    fatG:     { type: 'number', description: 'Optional fat estimate in grams.' },
                  },
                  required: ['proteinG', 'carbG'],
                },
              },
              required: ['name', 'quantity', 'calories', 'macros'],
            },
            minItems: 1,
          },
        },
        required: ['mealType', 'date', 'items'],
      },
    },
  },

  // ── Meal listing ─────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'list_meals',
      description:
        'Retrieve the user\'s logged meals for a given date or date range. ' +
        'Use this when the user asks what they ate, wants to see their meal history, ' +
        'or needs meal data to answer a follow-up question.',
      parameters: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format (inclusive). Defaults to today.',
          },
          to: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format (inclusive). Defaults to today.',
          },
          mealType: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'Optional filter by meal type.',
          },
        },
        required: ['from', 'to'],
      },
    },
  },

  // ── Today summary ─────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'get_today_summary',
      description:
        'Get a summary of today\'s nutrition totals (calories, protein, carbs, fat) ' +
        'and how they compare to the user\'s current goals. ' +
        'Use this for questions like "how am I doing today?", "calories left?", "how much protein today?".',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'The date to summarise in YYYY-MM-DD format. Defaults to today.',
          },
        },
        required: ['date'],
      },
    },
  },

  // ── Weekly summary ───────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'get_weekly_summary',
      description:
        'Get the last 7 days of calorie and macro data for the user. ' +
        'Use this for questions about weekly progress, trends, averages, or weekly summaries.',
      parameters: {
        type: 'object',
        properties: {
          from: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format.',
          },
          to: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format.',
          },
        },
        required: ['from', 'to'],
      },
    },
  },

  // ── Current goal ─────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'get_current_goal',
      description:
        'Get the user\'s current active nutrition goals (daily calorie target, protein, carbs, fat, weight goal). ' +
        'Use this when the user asks about their goals or targets.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },

  // ── Set goal ─────────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'set_goal',
      description:
        'Create or update the user\'s daily nutrition goals. ' +
        'Use this when the user wants to change their calorie target, macro targets, or weight goal. ' +
        'Fetch the current goal first if you need to preserve values the user did not mention.',
      parameters: {
        type: 'object',
        properties: {
          dailyCalorieTarget: {
            type: 'number',
            description: 'Daily calorie goal in kcal.',
          },
          proteinTargetG: {
            type: 'number',
            description: 'Daily protein goal in grams.',
          },
          carbTargetG: {
            type: 'number',
            description: 'Daily carbohydrate goal in grams.',
          },
          fatTargetG: {
            type: 'number',
            description: 'Optional daily fat goal in grams.',
          },
          weightGoalKg: {
            type: 'number',
            description: 'Optional target body weight in kilograms.',
          },
        },
        required: ['dailyCalorieTarget', 'proteinTargetG', 'carbTargetG'],
      },
    },
  },

  // ── Nutrition info ───────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'get_nutrition_info',
      description:
        'Answer a general nutritional knowledge question about a specific food or ingredient. ' +
        'Use this when the user asks things like "how many calories in X?", ' +
        '"what macros does Y have?", or "is Z high in protein?". ' +
        'This does NOT look at the user\'s personal data.',
      parameters: {
        type: 'object',
        properties: {
          food: {
            type: 'string',
            description: 'The food or ingredient to look up, e.g. "100g salmon", "1 banana", "a cup of oats".',
          },
        },
        required: ['food'],
      },
    },
  },

  // ── Delete meal ──────────────────────────────────────────────────────────────
  {
    type: 'function',
    function: {
      name: 'delete_meal',
      description:
        'Delete a specific logged meal by its ID. ' +
        'Only use this after the user explicitly asks to delete or remove a meal, ' +
        'and you have the meal ID from a previous list_meals call.',
      parameters: {
        type: 'object',
        properties: {
          mealId: {
            type: 'string',
            description: 'The MongoDB _id of the meal to delete.',
          },
        },
        required: ['mealId'],
      },
    },
  },
];
