import { importsService } from './imports.service.js';

export const importsController = {
  /**
   * POST /api/v1/imports/csv/parse
   * Accepts a CSV via multipart/form-data (field: "csv")
   * Returns parsed rows for user preview.
   */
  async parseCsv(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'No CSV file uploaded. Use field name "csv".' },
        });
      }

      // Multer already enforces size limit, but we double-check MIME
      const mime = req.file.mimetype;
      const hasCsvExtension = req.file.originalname.toLowerCase().endsWith('.csv');
      const isCsvMime = [
        'text/csv',
        'application/csv',
        'application/vnd.ms-excel',
        'text/plain',
      ].includes(mime);
      if (!isCsvMime && !hasCsvExtension) {
        return res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: `Unsupported file type: ${mime}. Only CSV files are accepted.`,
          },
        });
      }

      const result = importsService.parseCSV(req.file.buffer, req.file.originalname);

      res.status(200).json({
        data: {
          rows: result.rows,
          tableHeaders: result.tableHeaders,
          warnings: result.warnings,
          totalRows: result.rowCount,
          validRows: result.rows.filter((r) => r._valid).length,
          invalidRows: result.rows.filter((r) => !r._valid).length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
  * POST /api/v1/imports/csv/confirm
   * Accepts confirmed rows after user review and bulk-saves them as meals.
   */
  async confirmImport(req, res, next) {
    try {
      const { rows, defaultDate, defaultMealType } = req.body;

      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'rows must be a non-empty array' },
        });
      }

      if (rows.length > 500) {
        return res.status(400).json({
          error: { code: 'BAD_REQUEST', message: 'Cannot import more than 500 rows at once' },
        });
      }

      // defaultDate must be valid YYYY-MM-DD
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      const resolvedDate = datePattern.test(defaultDate)
        ? defaultDate
        : new Date().toISOString().split('T')[0];

      const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      const resolvedMealType = validMealTypes.includes(defaultMealType)
        ? defaultMealType
        : 'snack';

      const result = await importsService.confirmImport(
        req.user.id,
        rows,
        resolvedDate,
        resolvedMealType,
        req.timezone,
      );

      res.status(200).json({
        data: {
          imported: result.imported,
          failed: result.failed,
          errors: result.errors,
          meals: result.meals,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
