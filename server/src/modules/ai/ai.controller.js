import { aiService } from './ai.service.js';
import { AppError } from '../../common/middleware/errorHandler.middleware.js';
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const aiController = {
    async extract(req, res, next) {
        try {
            const extractionType = req.query['type'];
            if (!['label', 'plate'].includes(extractionType)) {
             throw new AppError(400, 'BAD_REQUEST', 'type query param must be "label" or "plate"');
            }
            // multer populates req.file
            const file = req.file;
            if (!file) {
             throw new AppError(400, 'BAD_REQUEST', 'Image file is required');
            }
            // File validation — MIME type allowlist
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
             throw new AppError(400, 'INVALID_FILE_TYPE', `File type not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(', ')}`);
            }
            // Size cap
            if (file.size > MAX_FILE_SIZE_BYTES) {
             throw new AppError(400, 'FILE_TOO_LARGE', 'Image must be under 5MB');
            }
          const result = await aiService.extractFromImage(file.buffer, file.mimetype, extractionType);
            res.status(200).json({ data: result });
        }
        catch (err) {
            next(err);
        }
    },
};