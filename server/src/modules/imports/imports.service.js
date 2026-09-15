import { z } from 'zod';
import { Errors } from '../../common/middleware/errorHandler.middleware.js';
import { mealsService } from '../meals/meals.service.js';

// ── Column alias map ──────────────────────────────────────────────────────────
// Maps every likely CSV header (after normalization) → internal field key.
// Normalization: lowercase, strip parenthetical units & special chars, collapse whitespace.
const HEADER_ALIASES = {
  // name
  'food': 'name', 'item': 'name', 'meal': 'name', 'food item': 'name',
  'description': 'name', 'name': 'name', 'food name': 'name', 'dish': 'name',

  // calories
  'calories': 'calories', 'energy': 'calories', 'cal': 'calories', 'kcal': 'calories',
  'cals': 'calories', 'calories kcal': 'calories', 'energy kcal': 'calories',
  'total calories': 'calories', 'calorie': 'calories',

  // protein
  'protein': 'protein_g', 'prot': 'protein_g', 'pro': 'protein_g',
  'protein g': 'protein_g', 'pro g': 'protein_g', 'prot g': 'protein_g',
  'total protein': 'protein_g',

  // carbs
  'carbohydrates': 'carbs_g', 'carbs': 'carbs_g', 'carb': 'carbs_g',
  'carbs g': 'carbs_g', 'carb g': 'carbs_g', 'total carbs': 'carbs_g',
  'total carbohydrates': 'carbs_g', 'net carbs': 'carbs_g',
  'carbohydrate': 'carbs_g',

  // fat
  'fat': 'fat_g', 'total fat': 'fat_g', 'fat g': 'fat_g', 'fats g': 'fat_g',
  'lipids': 'fat_g', 'total lipids': 'fat_g', 'fats': 'fat_g',

  // date
  'date': 'date', 'day': 'date', 'logged on': 'date', 'log date': 'date',
  'entry date': 'date',

  // meal type
  'meal type': 'meal_type', 'category': 'meal_type', 'type': 'meal_type',
  'meal name': 'meal_type', 'mealtype': 'meal_type',

  // quantity
  'serving size': 'quantity', 'amount': 'quantity', 'qty': 'quantity',
  'quantity': 'quantity', 'serving': 'quantity', 'portion': 'quantity',
  'serving amount': 'quantity',

  // quantity (split columns)
  'quantity amount': 'quantity_amount', 'serving amount': 'quantity_amount',
  'qty amount': 'quantity_amount', 'amount number': 'quantity_amount',
  'quantity unit': 'quantity_unit', 'serving unit': 'quantity_unit',
  'qty unit': 'quantity_unit', 'unit': 'quantity_unit',

  // ── Micronutrients ──────────────────────────────────────────────────────
  'sodium': 'sodium_mg', 'sodium mg': 'sodium_mg', 'na': 'sodium_mg', 'salt': 'sodium_mg',

  'fiber': 'fiber_g', 'dietary fiber': 'fiber_g', 'fibre': 'fiber_g',
  'total fiber': 'fiber_g', 'fiber g': 'fiber_g', 'fibre g': 'fiber_g',
  'dietary fibre': 'fiber_g',

  'sugar': 'sugar_g', 'sugars': 'sugar_g', 'total sugar': 'sugar_g',
  'total sugars': 'sugar_g', 'sugar g': 'sugar_g', 'sugars g': 'sugar_g',

  'calcium': 'calcium_mg', 'calcium mg': 'calcium_mg', 'ca': 'calcium_mg',

  'iron': 'iron_mg', 'iron mg': 'iron_mg', 'fe': 'iron_mg',

  'vitamin a': 'vitaminA_mcg', 'vit a': 'vitaminA_mcg', 'vitamin a mcg': 'vitaminA_mcg',
  'vitamin a g': 'vitaminA_mcg', 'retinol': 'vitaminA_mcg',

  'vitamin c': 'vitaminC_mg', 'vit c': 'vitaminC_mg', 'vitamin c mg': 'vitaminC_mg',
  'ascorbic acid': 'vitaminC_mg',

  'vitamin d': 'vitaminD_mcg', 'vit d': 'vitaminD_mcg', 'vitamin d mcg': 'vitaminD_mcg',
  'cholecalciferol': 'vitaminD_mcg',

  'vitamin e': 'vitaminE_mg', 'vit e': 'vitaminE_mg', 'vitamin e mg': 'vitaminE_mg',
  'alpha tocopherol': 'vitaminE_mg',

  'vitamin k': 'vitaminK_mcg', 'vit k': 'vitaminK_mcg', 'vitamin k mcg': 'vitaminK_mcg',

  'thiamin': 'thiamin_mg', 'thiamine': 'thiamin_mg', 'thiamin mg': 'thiamin_mg',
  'thiamine mg': 'thiamin_mg', 'vitamin b1': 'thiamin_mg', 'b1': 'thiamin_mg',

  'riboflavin': 'riboflavin_mg', 'riboflavin mg': 'riboflavin_mg',
  'vitamin b2': 'riboflavin_mg', 'b2': 'riboflavin_mg',

  'niacin': 'niacin_mg', 'niacin mg': 'niacin_mg', 'vitamin b3': 'niacin_mg',
  'b3': 'niacin_mg', 'nicotinic acid': 'niacin_mg',

  'vitamin b6': 'vitaminB6_mg', 'vit b6': 'vitaminB6_mg', 'b6': 'vitaminB6_mg',
  'vitamin b6 mg': 'vitaminB6_mg', 'pyridoxine': 'vitaminB6_mg',

  'vitamin b12': 'vitaminB12_mcg', 'vit b12': 'vitaminB12_mcg', 'b12': 'vitaminB12_mcg',
  'vitamin b12 mcg': 'vitaminB12_mcg', 'cobalamin': 'vitaminB12_mcg',

  'folate': 'folate_mcg', 'folic acid': 'folate_mcg', 'folate mcg': 'folate_mcg',
  'folic acid mcg': 'folate_mcg', 'vitamin b9': 'folate_mcg', 'b9': 'folate_mcg',

  'magnesium': 'magnesium_mg', 'magnesium mg': 'magnesium_mg', 'mg': 'magnesium_mg',

  'potassium': 'potassium_mg', 'potassium mg': 'potassium_mg', 'k': 'potassium_mg',

  'zinc': 'zinc_mg', 'zinc mg': 'zinc_mg', 'zn': 'zinc_mg',

  'selenium': 'selenium_mcg', 'selenium mcg': 'selenium_mcg', 'se': 'selenium_mcg',
};

// ── Zod: validate a single parsed row ─────────────────────────────────────────
const ParsedRowSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  calories: z.number().min(0).max(10000),
  protein_g: z.number().min(0).max(1000),
  carbs_g: z.number().min(0).max(2000),
  fat_g: z.number().min(0).max(1000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).nullable().optional(),
  quantity_amount: z.number().min(0).nullable().optional(),
  quantity_unit: z.string().max(50).nullable().optional(),
  sodium_mg: z.number().min(0).nullable().optional(),
  fiber_g: z.number().min(0).nullable().optional(),
  sugar_g: z.number().min(0).nullable().optional(),
  calcium_mg: z.number().min(0).nullable().optional(),
  iron_mg: z.number().min(0).nullable().optional(),
  vitaminA_mcg: z.number().min(0).nullable().optional(),
  vitaminC_mg: z.number().min(0).nullable().optional(),
  vitaminD_mcg: z.number().min(0).nullable().optional(),
  vitaminE_mg: z.number().min(0).nullable().optional(),
  vitaminK_mcg: z.number().min(0).nullable().optional(),
  thiamin_mg: z.number().min(0).nullable().optional(),
  riboflavin_mg: z.number().min(0).nullable().optional(),
  niacin_mg: z.number().min(0).nullable().optional(),
  vitaminB6_mg: z.number().min(0).nullable().optional(),
  vitaminB12_mcg: z.number().min(0).nullable().optional(),
  folate_mcg: z.number().min(0).nullable().optional(),
  magnesium_mg: z.number().min(0).nullable().optional(),
  potassium_mg: z.number().min(0).nullable().optional(),
  zinc_mg: z.number().min(0).nullable().optional(),
  selenium_mcg: z.number().min(0).nullable().optional(),
});

// ── Zod: validate a confirmed row (after user review) ─────────────────────────
const ConfirmedRowSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  calories: z.number().min(0).max(10000),
  protein_g: z.number().min(0).max(1000),
  carbs_g: z.number().min(0).max(2000),
  fat_g: z.number().min(0).max(1000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).nullable().optional(),
  quantity_amount: z.number().min(0).nullable().optional(),
  quantity_unit: z.string().max(50).nullable().optional(),
  sodium_mg: z.number().min(0).nullable().optional(),
  fiber_g: z.number().min(0).nullable().optional(),
  sugar_g: z.number().min(0).nullable().optional(),
  calcium_mg: z.number().min(0).nullable().optional(),
  iron_mg: z.number().min(0).nullable().optional(),
  vitaminA_mcg: z.number().min(0).nullable().optional(),
  vitaminC_mg: z.number().min(0).nullable().optional(),
  vitaminD_mcg: z.number().min(0).nullable().optional(),
  vitaminE_mg: z.number().min(0).nullable().optional(),
  vitaminK_mcg: z.number().min(0).nullable().optional(),
  thiamin_mg: z.number().min(0).nullable().optional(),
  riboflavin_mg: z.number().min(0).nullable().optional(),
  niacin_mg: z.number().min(0).nullable().optional(),
  vitaminB6_mg: z.number().min(0).nullable().optional(),
  vitaminB12_mcg: z.number().min(0).nullable().optional(),
  folate_mcg: z.number().min(0).nullable().optional(),
  magnesium_mg: z.number().min(0).nullable().optional(),
  potassium_mg: z.number().min(0).nullable().optional(),
  zinc_mg: z.number().min(0).nullable().optional(),
  selenium_mcg: z.number().min(0).nullable().optional(),
});

// ── Micro storage key list ─────────────────────────────────────────────────────
const MICRO_FIELDS = [
  'sodium_mg', 'fiber_g', 'sugar_g', 'calcium_mg', 'iron_mg',
  'vitaminA_mcg', 'vitaminC_mg', 'vitaminD_mcg', 'vitaminE_mg', 'vitaminK_mcg',
  'thiamin_mg', 'riboflavin_mg', 'niacin_mg', 'vitaminB6_mg', 'vitaminB12_mcg',
  'folate_mcg', 'magnesium_mg', 'potassium_mg', 'zinc_mg', 'selenium_mcg',
];

// ── CSV Parsing helpers ───────────────────────────────────────────────────────

/**
 * Parse a single CSV line, correctly handling:
 * - Quoted fields (may contain commas)
 * - Escaped double-quotes ("") inside quoted fields
 */
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        // Escaped quote inside a quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

/**
 * Normalize a column header for alias lookup:
 * - lowercase
 * - strip parenthetical unit suffixes like "(mg)", "(g)", "(mcg)", "(kcal)", "(µg)"
 * - remove non-alphanumeric characters except spaces
 * - collapse multiple spaces
 */
function normalizeHeader(raw) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, '')     // strip (units)
    .replace(/[^a-z0-9\s]/g, '') // strip punctuation
    .replace(/\s+/g, ' ')        // collapse whitespace
    .trim();
}

/**
 * Try to parse a numeric value from a CSV cell.
 * Handles: "25", "25.3", "25 g", "< 1", "~10", empty string.
 * Returns null if not parseable.
 */
function parseNumber(raw) {
  if (raw === null || raw === undefined || raw === '' || raw === '-' || raw === 'N/A') {
    return null;
  }
  // Strip non-numeric prefix chars like "<", "~", "≈"
  const cleaned = String(raw).replace(/[<>~≈≤≥]/g, '').trim();
  // Strip trailing unit text (e.g. "25 g", "300 mg")
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Try to parse a date cell into YYYY-MM-DD.
 * Handles: "2024-09-13", "09/13/2024", "13/09/2024", "Sep 13 2024", etc.
 * Returns null if not parseable.
 */
function parseDate(raw) {
  if (!raw || raw.trim() === '') return null;
  const s = raw.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // MM/DD/YYYY or DD/MM/YYYY — try both, prefer the one that makes a valid date
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const [, a, b, rawYear] = slashMatch;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    // Try MM/DD/YYYY first
    const d1 = new Date(`${year}-${String(a).padStart(2,'0')}-${String(b).padStart(2,'0')}`);
    if (!isNaN(d1.getTime())) {
      return `${year}-${String(a).padStart(2,'0')}-${String(b).padStart(2,'0')}`;
    }
    // Try DD/MM/YYYY
    const d2 = new Date(`${year}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`);
    if (!isNaN(d2.getTime())) {
      return `${year}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;
    }
  }

  // Natural language dates: "Sep 13 2024", "13 Sep 2024", "September 13, 2024"
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Normalize a meal type value to one of the four accepted enum values.
 * Returns null if it doesn't map.
 */
function parseMealType(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  if (['breakfast', 'lunch', 'dinner', 'snack'].includes(lower)) return lower;
  // Common aliases
  if (['morning', 'am', 'brunch'].includes(lower)) return 'breakfast';
  if (['noon', 'midday', 'pm'].includes(lower)) return 'lunch';
  if (['evening', 'supper', 'night'].includes(lower)) return 'dinner';
  if (['snacks', 'treat', 'dessert', 'drink', 'beverage'].includes(lower)) return 'snack';
  return null;
}

/**
 * Parse a "quantity" cell that combines amount + unit, e.g. "100 g", "1 cup", "250ml".
 * Returns { amount: number|null, unit: string|null }
 */
function parseQuantityCell(raw) {
  if (!raw || raw.trim() === '') return { amount: null, unit: null };
  const match = raw.trim().match(/^([\d.]+)\s*([a-zA-Z]+)?/);
  if (!match) return { amount: null, unit: null };
  return {
    amount: parseFloat(match[1]) || null,
    unit: match[2] ? match[2].toLowerCase() : null,
  };
}

// ── Build micros object from a parsed row ─────────────────────────────────────
function buildMicros(row) {
  const micros = {};
  for (const field of MICRO_FIELDS) {
    if (row[field] != null) micros[field] = row[field];
  }
  return Object.keys(micros).length > 0 ? micros : undefined;
}

export const importsService = {
  /**
   * Parse a CSV buffer into a list of preview rows.
   * Pure text parsing — no external API calls.
   *
   * @param {Buffer} csvBuffer
   * @param {string} filename
   * @returns {{ rows, tableHeaders, rowCount, warnings }}
   */
  parseCSV(csvBuffer, filename = 'import.csv') {
    if (!csvBuffer || csvBuffer.length === 0) {
      throw Errors.badRequest('CSV file is empty');
    }
    if (csvBuffer.length > 5 * 1024 * 1024) {
      throw Errors.badRequest('CSV file exceeds 5 MB limit');
    }

    // Decode — handle BOM (UTF-8 BOM from Excel)
    let text = csvBuffer.toString('utf-8');
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM

    // Split into non-empty lines
    const rawLines = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((l) => l.trim() !== '');

    if (rawLines.length < 2) {
      throw Errors.badRequest('CSV must have a header row and at least one data row');
    }

    // ── Parse header row ────────────────────────────────────────────────────
    const rawHeaders = parseCSVLine(rawLines[0]);
    const tableHeaders = rawHeaders.map((h) => h.trim());

    // Map each column index → internal field key (or null if unrecognized)
    const colMap = rawHeaders.map((h) => {
      const normalized = normalizeHeader(h);
      return HEADER_ALIASES[normalized] ?? null;
    });

    // Verify at least the 5 required columns are present
    const presentFields = new Set(colMap.filter(Boolean));
    const required = ['name', 'calories', 'protein_g', 'carbs_g', 'fat_g'];
    const missingRequired = required.filter((f) => !presentFields.has(f));

    if (missingRequired.length > 0) {
      throw Errors.badRequest(
        `CSV is missing required columns: ${missingRequired.join(', ')}. ` +
        `Found headers: ${tableHeaders.join(', ')}`
      );
    }

    const globalWarnings = [];
    if (rawLines.length > 501) {
      globalWarnings.push('Only the first 500 data rows will be shown in the preview.');
    }

    // ── Parse data rows ─────────────────────────────────────────────────────
    const dataLines = rawLines.slice(1, 501); // cap at 500
    const rows = dataLines.map((line, lineIdx) => {
      const cells = parseCSVLine(line);
      const raw = {};

      colMap.forEach((fieldKey, colIdx) => {
        if (!fieldKey) return; // unrecognized column — skip
        const cellValue = cells[colIdx] ?? '';
        raw[fieldKey] = cellValue;
      });

      // ── Field coercions ─────────────────────────────────────────────────
      // name (string)
      const name = (raw['name'] ?? '').trim();

      // macros (numbers)
      const calories   = parseNumber(raw['calories']);
      const protein_g  = parseNumber(raw['protein_g']);
      const carbs_g    = parseNumber(raw['carbs_g']);
      const fat_g      = parseNumber(raw['fat_g']);

      // date
      const date = parseDate(raw['date']);

      // meal_type
      const meal_type = parseMealType(raw['meal_type']);

      // quantity — may come from a combined column or two separate columns
      let quantity_amount = null;
      let quantity_unit = null;
      if (raw['quantity'] !== undefined) {
        const q = parseQuantityCell(raw['quantity']);
        quantity_amount = q.amount;
        quantity_unit = q.unit;
      }
      if (raw['quantity_amount'] !== undefined) {
        quantity_amount = parseNumber(raw['quantity_amount']);
      }
      if (raw['quantity_unit'] !== undefined) {
        quantity_unit = raw['quantity_unit'].trim() || null;
      }

      // micronutrients
      const microValues = {};
      for (const field of MICRO_FIELDS) {
        if (raw[field] !== undefined) {
          const v = parseNumber(raw[field]);
          if (v !== null) microValues[field] = v;
        }
      }

      // Build the candidate row
      const candidate = {
        name,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        date,
        meal_type,
        quantity_amount,
        quantity_unit,
        ...microValues,
      };

      // ── Validate with Zod ───────────────────────────────────────────────
      const result = ParsedRowSchema.safeParse(candidate);
      const warnings = [];

      if (!result.success) {
        const errors = result.error.issues.map((i) => i.message);
        const missingFields = result.error.issues
          .filter((i) => i.code === 'invalid_type' || i.code === 'too_small')
          .map((i) => i.path.join('.'))
          .filter(Boolean);
        return {
          _rowIndex: lineIdx,
          _valid: false,
          _errors: errors,
          _missingRequired: missingFields,
          ...candidate,
        };
      }

      // Calorie vs macro consistency check (±30% tolerance)
      const { calories: cal, protein_g: prot, carbs_g: carbs, fat_g: fat } = result.data;
      const expectedCal = prot * 4 + carbs * 4 + fat * 9;
      if (expectedCal > 0) {
        const diff = Math.abs(cal - expectedCal) / expectedCal;
        if (diff > 0.30) {
          warnings.push(
            `Calories (${cal}) differ from macro-derived estimate (${Math.round(expectedCal)} kcal). Please verify.`
          );
        }
      }

      return {
        _rowIndex: lineIdx,
        _valid: true,
        _warnings: warnings,
        ...result.data,
      };
    });

    return {
      rows,
      tableHeaders,
      rowCount: rows.length,
      warnings: globalWarnings,
    };
  },

  /**
   * Bulk-imports confirmed rows as meals.
   * Each CSV row becomes one single-item meal.
   * Reuses mealsService.createMeal() — the single write path.
   *
   * @param {string}   userId
   * @param {object[]} rows
   * @param {string}   defaultDate       YYYY-MM-DD fallback
   * @param {string}   defaultMealType   fallback meal type
   * @param {string}   timezone
   */
  async confirmImport(userId, rows, defaultDate, defaultMealType, timezone) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw Errors.badRequest('No rows provided for import');
    }

    const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
    const imported = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const validation = ConfirmedRowSchema.safeParse(row);
      if (!validation.success) {
        errors.push({
          rowIndex: i,
          name: row.name ?? `Row ${i + 1}`,
          reason: validation.error.issues.map((e) => e.message).join('; '),
        });
        continue;
      }

      const r = validation.data;
      const date = r.date || defaultDate;
      const mealType = VALID_MEAL_TYPES.includes(r.meal_type)
        ? r.meal_type
        : VALID_MEAL_TYPES.includes(defaultMealType)
        ? defaultMealType
        : 'snack';

      try {
        const meal = await mealsService.createMeal(userId, {
          mealType,
          date,
          timezone,
          source: 'import',
          items: [
            {
              name: r.name,
              calories: r.calories,
              quantity: {
                amount: r.quantity_amount ?? 1,
                unit: r.quantity_unit ?? 'serving',
              },
              macros: {
                proteinG: r.protein_g,
                carbG: r.carbs_g,
                fatG: r.fat_g,
              },
              micros: buildMicros(r),
            },
          ],
        });
        imported.push(meal);
      } catch (err) {
        errors.push({
          rowIndex: i,
          name: r.name,
          reason: err?.message ?? 'Unknown error',
        });
      }
    }

    return {
      imported: imported.length,
      failed: errors.length,
      meals: imported,
      errors,
    };
  },
};
