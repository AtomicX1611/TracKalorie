import { Router } from 'express';
import multer from 'multer';
import { importsController } from './imports.controller.js';

// Memory storage — buffer is passed directly to OpenAI, no disk write needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max for CSV files
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const isCsvMime = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'text/plain',
    ].includes(file.mimetype);
    const isCsvName = file.originalname.toLowerCase().endsWith('.csv');

    if (isCsvMime || isCsvName) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted'), false);
    }
  },
});

const router = Router();
export { router as importsRouter };

// POST /api/v1/imports/csv/parse
// Parses an uploaded CSV and returns rows for preview
router.post('/csv/parse', upload.single('csv'), importsController.parseCsv);

// POST /api/v1/imports/csv/confirm
// Bulk-imports confirmed rows as meals
router.post('/csv/confirm', importsController.confirmImport);
