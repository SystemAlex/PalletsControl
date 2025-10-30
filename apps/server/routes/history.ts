import { Router } from 'express';
import { db } from '../db';
import { users, loginHistory } from '../db/schema';
import { eq, desc, sql, inArray, or, ilike, and, asc } from 'drizzle-orm';
import { AuthRequest, roleHierarchy, UserRole, allAvailableRoles } from '../../shared/types';
import { renewToken } from '../middleware/session';
import { UnauthorizedError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/login', verifyToken, renewToken, async (req: AuthRequest, res, next) => {
  try {
    const userRole = req.user?.role as UserRole;

    if (!userRole) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const endpointAllowedRoles = ['admin', 'developer'];
    if (!endpointAllowedRoles.includes(userRole)) {
      return res.json({ history: [], totalCount: 0 });
    }

    let rolesToIncludeInHistory: UserRole[] = [];

    if (userRole === 'admin') {
      rolesToIncludeInHistory = [...allAvailableRoles];
    } else if (userRole === 'developer') {
      rolesToIncludeInHistory = allAvailableRoles.filter((role) => role !== 'admin');
    } else {
      return res.json({ history: [], totalCount: 0 });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 50, 500); // Max 500 records overall
    const offset = parseInt(req.query.offset as string) || 0;
    const searchQuery = req.query.search as string | undefined;

    if (limit <= 0 || offset < 0) {
      throw new UnauthorizedError('Parámetros de paginación inválidos');
    }

    const conditions = [];

    if (rolesToIncludeInHistory.length > 0) {
      conditions.push(inArray(users.role, rolesToIncludeInHistory));
    } else {
      return res.json({ history: [], totalCount: 0 });
    }

    if (searchQuery) {
      const searchPattern = `%${searchQuery.toLowerCase()}%`;
      conditions.push(
        or(ilike(users.username, searchPattern), ilike(users.realname, searchPattern)),
      );
    }

    // Define the CTE for ranking login history per user
    const userLoginRank = db.$with('user_login_rank').as(
      db
        .select({
          id: loginHistory.id,
          timestamp: loginHistory.timestamp,
          success: loginHistory.success,
          userId: loginHistory.userId, // Keep userId for joining with users table later
          rn: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${loginHistory.userId} ORDER BY ${loginHistory.timestamp} DESC)`.as(
            'rn',
          ), // Añadido .as('rn')
        })
        .from(loginHistory)
        .leftJoin(users, eq(loginHistory.userId, users.id)) // Join users here to apply role/search conditions
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    );

    const roleHierarchyCase = sql`CASE ${sql.join(
      roleHierarchy.map((role, index) => sql`WHEN ${users.role} = ${role} THEN ${index}`),
      sql` `,
    )} ELSE ${roleHierarchy.length} END`;

    const query = db
      .with(userLoginRank)
      .select({
        id: userLoginRank.id,
        timestamp: userLoginRank.timestamp,
        success: userLoginRank.success,
        username: users.username,
        realname: users.realname,
        role: users.role,
        isActive: users.isActive,
      })
      .from(userLoginRank)
      .leftJoin(users, eq(userLoginRank.userId, users.id))
      .where(sql`${userLoginRank.rn} <= 50`) // Filter for the last 50 records per user
      .orderBy(asc(roleHierarchyCase), asc(users.realname), desc(userLoginRank.timestamp))
      .limit(limit)
      .offset(offset);

    const history = await query;

    // For total count, we need to count the number of records *after* applying the rn <= 50 filter
    // This requires a similar CTE for counting.
    const totalCountQuery = db.$with('filtered_user_login_rank').as(
      db
        .select({
          id: loginHistory.id,
          userId: loginHistory.userId,
          rn: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${loginHistory.userId} ORDER BY ${loginHistory.timestamp} DESC)`.as(
            'rn',
          ), // Añadido .as('rn')
        })
        .from(loginHistory)
        .leftJoin(users, eq(loginHistory.userId, users.id)) // Join users here to apply role/search conditions
        .where(conditions.length > 0 ? and(...conditions) : undefined),
    );

    const [{ count: totalCount }] = await db
      .with(totalCountQuery)
      .select({ count: sql<number>`count(*)` })
      .from(totalCountQuery)
      .where(sql`${totalCountQuery.rn} <= 50`);

    res.json({ history, totalCount: totalCount ?? 0 });
  } catch (error) {
    next(error);
  }
});

export default router;