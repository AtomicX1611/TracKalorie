import { Request, Response, NextFunction } from 'express';


function isValidIANATimezone(tz: string): boolean {
  if (!tz || tz.length > 64) return false;
  // Basic structural guard: IANA zones are "Area/Location" or "UTC" etc.
  if (!/^[A-Za-z_]+(?:\/[A-Za-z_+-]+)*$/.test(tz) && tz !== 'UTC') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function timezoneMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const headerTz = req.headers['x-timezone'];
  const tz = typeof headerTz === 'string' ? headerTz.trim() : '';

  if (isValidIANATimezone(tz)) {
    req.timezone = tz;
  } else {
    req.timezone = 'UTC';
  }

  next();
}
