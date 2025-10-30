import { Router, NextFunction, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { palletActionLogs } from '../db/schema';
import { desc, and, eq, ilike, or, sql } from 'drizzle-orm';
import { UnauthorizedError, BadRequestError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';
import { renewToken } from '../middleware/session';
import { AuthRequest, UserRole } from '../../shared/types';

const router = Router();

const allowedRoles: UserRole[] = ['admin', 'developer'];

const checkRoles = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    throw new UnauthorizedError('No tienes permiso para acceder a esta información.');
  }
  next();
};

const getPalletActionLogsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  actionType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Helper para obtener la condición de filtrado por empresa
const getEmpresaFilterCondition = (req: AuthRequest) => {
  const requesterRole = req.user?.role as UserRole;
  const requesterIdEmpresa = req.user?.idEmpresa;

  if (requesterRole === 'admin') {
    return undefined; // Admin ve todo
  }

  if (!requesterIdEmpresa) {
    throw new UnauthorizedError('Tu cuenta no está asignada a una empresa.');
  }

  return eq(palletActionLogs.idEmpresa, requesterIdEmpresa);
};

router.get('/', verifyToken, renewToken, checkRoles, async (req: AuthRequest, res, next) => {
  try {
    const validation = getPalletActionLogsSchema.safeParse(req.query);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const { limit, offset, search, actionType, startDate, endDate } = validation.data;

    const empresaFilter = getEmpresaFilterCondition(req);

    const conditions = [];
    if (empresaFilter) {
      conditions.push(empresaFilter);
    }

    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(palletActionLogs.description, searchPattern),
          ilike(palletActionLogs.username, searchPattern),
          ilike(palletActionLogs.realname, searchPattern),
          ilike(palletActionLogs.actionType, searchPattern),
        ),
      );
    }

    if (actionType) {
      conditions.push(eq(palletActionLogs.actionType, actionType));
    }

    if (startDate) {
      conditions.push(sql`${palletActionLogs.timestamp} >= ${startDate}::date`);
    }
    if (endDate) {
      conditions.push(
        sql`${palletActionLogs.timestamp} <= ${endDate}::date + INTERVAL '1 day' - INTERVAL '1 second'`,
      );
    }

    const logs = await db.query.palletActionLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(palletActionLogs.timestamp),
      limit,
      offset,
    });

    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(palletActionLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json({ logs, totalCount: totalCount ?? 0 });
  } catch (error) {
    next(error);
  }
});

export default router;
