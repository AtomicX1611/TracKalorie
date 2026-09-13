import { config } from '../config/config.js';
export function singleTenantMiddleware(req, _res, next) {
    req.user = { id: config.singleTenant.userId, email: 'tenant@local' };
    next();
}