/**
 * OpenAI structured output schema for PDF food diary / nutrition history parsing.
 *
 * The model is asked to extract every row from a tabular food diary or nutrition
 * history PDF and return a strictly-typed JSON array.
 *
 * Required columns (macronutrients + food name):
 *   name, calories, protein_g, carbs_g, fat_g
 *
 * Optional columns (user-defined; model must not fabricate them):
 *   date, meal_type, quantity_amount, quantity_unit,
 *   + any supported micronutrient columns
 *
 * The schema uses strict:false because the optional micro fields make
 * strict:true with additionalProperties:false incompatible in OpenAI's
 * structured-outputs mode (optional keys must still appear in properties).
 * We validate completeness server-side with Zod after receiving the response.
 */

export const PDF_IMPORT_SCHEMA = {
  name: 'food_diary_import',
  strict: false,
  schema: {
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        description: 'One object per food/meal row found in the table',
        items: {
          type: 'object',
          properties: {
            // ── Required ───────────────────────────────────────────────
            name: {
              type: 'string',
              description: 'Food or meal name as printed',
            },
            calories: {
              type: 'number',
              description: 'Total calories (kcal) for this row',
            },
            protein_g: {
              type: 'number',
              description: 'Protein in grams',
            },
            carbs_g: {
              type: 'number',
              description: 'Total carbohydrates in grams',
            },
            fat_g: {
              type: 'number',
              description: 'Total fat in grams',
            },
            // ── Optional ───────────────────────────────────────────────
            date: {
              type: ['string', 'null'],
              description:
                'Date in YYYY-MM-DD format if visible in the table; null otherwise',
            },
            meal_type: {
              type: ['string', 'null'],
              description:
                'One of: breakfast, lunch, dinner, snack — map column value if present; null otherwise',
            },
            quantity_amount: {
              type: ['number', 'null'],
              description: 'Serving quantity number if visible; null otherwise',
            },
            quantity_unit: {
              type: ['string', 'null'],
              description:
                'Serving unit (g, ml, oz, cup, tbsp, tsp, piece, bar, serving) if visible; null otherwise',
            },
            // ── Micronutrients (all optional) ──────────────────────────
            sodium_mg: { type: ['number', 'null'] },
            fiber_g: { type: ['number', 'null'] },
            sugar_g: { type: ['number', 'null'] },
            calcium_mg: { type: ['number', 'null'] },
            iron_mg: { type: ['number', 'null'] },
            vitaminA_mcg: { type: ['number', 'null'] },
            vitaminC_mg: { type: ['number', 'null'] },
            vitaminD_mcg: { type: ['number', 'null'] },
            magnesium_mg: { type: ['number', 'null'] },
            potassium_mg: { type: ['number', 'null'] },
            zinc_mg: { type: ['number', 'null'] },
            selenium_mcg: { type: ['number', 'null'] },
            vitaminE_mg: { type: ['number', 'null'] },
            vitaminK_mcg: { type: ['number', 'null'] },
            thiamin_mg: { type: ['number', 'null'] },
            riboflavin_mg: { type: ['number', 'null'] },
            niacin_mg: { type: ['number', 'null'] },
            vitaminB6_mg: { type: ['number', 'null'] },
            vitaminB12_mcg: { type: ['number', 'null'] },
            folate_mcg: { type: ['number', 'null'] },
          },
          required: ['name', 'calories', 'protein_g', 'carbs_g', 'fat_g'],
        },
      },
      page_count: {
        type: 'number',
        description: 'Number of pages in the PDF you were able to read',
      },
      table_headers: {
        type: 'array',
        items: { type: 'string' },
        description: 'The original column header names found in the PDF',
      },
    },
    required: ['rows', 'page_count', 'table_headers'],
  },
};

export const PDF_IMPORT_SYSTEM_PROMPT = `You are a precise food diary data extractor. You will receive one or more pages of a PDF containing a food diary or nutrition history in a tabular format.

Your task:
1. Identify ALL table rows containing food/meal entries.
2. For each row extract the required fields (name, calories, protein, carbs, fat) and any optional fields that are present.
3. Column headers may use many aliases — map them correctly:

   REQUIRED FIELDS:
   - name       ← "Food", "Item", "Meal", "Food Item", "Description", "Name"
   - calories   ← "Calories", "Energy", "Cal", "kcal", "Cals", "Energy (kcal)", "Calories (kcal)"
   - protein_g  ← "Protein", "Prot", "Pro", "Protein (g)", "Pro (g)", "Prot (g)"
   - carbs_g    ← "Carbohydrates", "Carbs", "Carb", "Carbs (g)", "Carb (g)", "Total Carbs", "Total Carbohydrates", "Net Carbs"
   - fat_g      ← "Fat", "Total Fat", "Fat (g)", "Fats (g)", "Lipids", "Total Lipids"

   OPTIONAL DATE/MEAL FIELDS:
   - date       ← "Date", "Day", "Logged On", "Log Date", "Entry Date"  (output as YYYY-MM-DD)
   - meal_type  ← "Meal", "Meal Type", "Category", "Type", "Meal Name"  (normalize to: breakfast/lunch/dinner/snack)
   - quantity_amount + quantity_unit ← "Serving Size", "Amount", "Qty", "Quantity", "Serving", "Portion"  (split the number from the unit)

   MICRONUTRIENTS (all optional — only extract if the column exists in the PDF):
   - sodium_mg      ← "Sodium", "Sodium (mg)", "Na", "Salt"
   - fiber_g        ← "Fiber", "Dietary Fiber", "Fibre", "Total Fiber", "Fiber (g)", "Fibre (g)"
   - sugar_g        ← "Sugar", "Sugars", "Total Sugar", "Total Sugars", "Sugar (g)", "Sugars (g)"
   - calcium_mg     ← "Calcium", "Calcium (mg)", "Ca"
   - iron_mg        ← "Iron", "Iron (mg)", "Fe"
   - vitaminA_mcg   ← "Vitamin A", "Vit A", "Vit. A", "Vitamin A (mcg)", "Vitamin A (µg)", "Retinol"
   - vitaminC_mg    ← "Vitamin C", "Vit C", "Vit. C", "Vitamin C (mg)", "Ascorbic Acid"
   - vitaminD_mcg   ← "Vitamin D", "Vit D", "Vit. D", "Vitamin D (mcg)", "Vitamin D (µg)", "Cholecalciferol"
   - vitaminE_mg    ← "Vitamin E", "Vit E", "Vit. E", "Vitamin E (mg)", "Alpha-Tocopherol"
   - vitaminK_mcg   ← "Vitamin K", "Vit K", "Vit. K", "Vitamin K (mcg)", "Vitamin K (µg)"
   - thiamin_mg     ← "Thiamin", "Thiamine", "Thiamin (mg)", "Thiamine (mg)", "Vitamin B1", "B1"
   - riboflavin_mg  ← "Riboflavin", "Riboflavin (mg)", "Vitamin B2", "B2"
   - niacin_mg      ← "Niacin", "Niacin (mg)", "Vitamin B3", "B3", "Nicotinic Acid"
   - vitaminB6_mg   ← "Vitamin B6", "Vit B6", "B6", "Vitamin B6 (mg)", "Pyridoxine"
   - vitaminB12_mcg ← "Vitamin B12", "Vit B12", "B12", "Vitamin B12 (mcg)", "Cobalamin", "Vitamin B12 (µg)"
   - folate_mcg     ← "Folate", "Folic Acid", "Folate (mcg)", "Folic Acid (mcg)", "Folate (µg)", "Vitamin B9", "B9"
   - magnesium_mg   ← "Magnesium", "Magnesium (mg)", "Mg"
   - potassium_mg   ← "Potassium", "Potassium (mg)", "K"
   - zinc_mg        ← "Zinc", "Zinc (mg)", "Zn"
   - selenium_mcg   ← "Selenium", "Selenium (mcg)", "Selenium (µg)", "Se"

4. NEVER invent values that are not in the table. If a column is absent from the PDF, output null for that field.
5. Skip any header rows, total/summary rows, or rows that are clearly not individual food entries.
6. Numbers must be numeric values (not strings). Remove any unit suffixes before outputting.
7. Dates must be in YYYY-MM-DD format. If the year is missing and the table implies the current year, use the current year.
8. For meal_type, only output: breakfast, lunch, dinner, or snack. If the column exists but the value doesn't map, output null.
9. Micronutrient values are typically in mg or mcg — do NOT convert units, just extract the number as printed.

Be deterministic. Return the same output for the same input.`;
