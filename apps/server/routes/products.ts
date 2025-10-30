import { Router, NextFunction, Response } from 'express';
import { db } from '../db';
import { articulos } from '../db/schema';
import { eq, ilike, or, and, sql, isNotNull, asc, ne } from 'drizzle-orm'; // Importar ne para 'not equal'
import { UnauthorizedError, BadRequestError, NotFoundError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';
import { renewToken } from '../middleware/session';
import { AuthRequest, UserRole } from '../../shared/types';

const router = Router();

const allowedRoles: UserRole[] = ['admin', 'developer', 'deposito'];

const checkRoles = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    throw new UnauthorizedError('No tienes permiso para acceder a esta información.');
  }
  next();
};

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

  return eq(articulos.idEmpresa, requesterIdEmpresa);
};

// Helper para seleccionar todas las columnas de articulos
const selectArticuloColumns = {
  idArticulo: articulos.idArticulo,
  desArticulo: articulos.desArticulo,
  unidadesBulto: articulos.unidadesBulto,
  anulado: articulos.anulado,
  esCombo: articulos.esCombo,
  idPresentacionBulto: articulos.idPresentacionBulto,
  idPresentacionUnidad: articulos.idPresentacionUnidad,
  codBarraBulto: articulos.codBarraBulto,
  bultosPallet: articulos.bultosPallet,
  pesoBulto: articulos.pesoBulto,
  categoria: articulos.categoria,
  subCategoria: articulos.subCategoria,
  marca: articulos.marca,
  idEmpresa: articulos.idEmpresa,
};

// GET: Obtener lista de artículos con búsqueda opcional
router.get('/', verifyToken, renewToken, checkRoles, async (req: AuthRequest, res, next) => {
  try {
    const searchQuery = req.query.search as string | undefined;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const empresaFilter = getEmpresaFilterCondition(req);

    const conditions = [
      eq(articulos.anulado, false),
      eq(articulos.esCombo, false),
      ne(articulos.codBarraBulto, ''), // cod_barra_bulto no vacío
      or(
        ne(articulos.categoria, 'OTHERS'), // categoria no es 'OTHERS'
        isNotNull(articulos.categoria), // o categoria es NULL
      ),
    ];

    if (empresaFilter) {
      conditions.push(empresaFilter);
    }

    if (searchQuery) {
      const searchPattern = `%${searchQuery.toLowerCase()}%`;
      conditions.push(
        or(
          ilike(articulos.desArticulo, searchPattern),
          sql`${articulos.idArticulo}::text ILIKE ${searchPattern}`,
        )!,
      );
    }

    const articles = await db
      .select(selectArticuloColumns)
      .from(articulos)
      .where(and(...conditions))
      .orderBy(asc(articulos.desArticulo)) // Ordenar alfabéticamente por desArticulo
      .limit(limit)
      .offset(offset);

    res.json(articles);
  } catch (error) {
    next(error);
  }
});

// GET: Obtener un artículo por ID
router.get('/:id', verifyToken, renewToken, checkRoles, async (req: AuthRequest, res, next) => {
  try {
    const idArticulo = parseInt(req.params.id, 10);
    if (isNaN(idArticulo)) {
      throw new BadRequestError('ID de artículo inválido.');
    }

    const empresaFilter = getEmpresaFilterCondition(req);

    const conditions = [eq(articulos.idArticulo, idArticulo)];
    if (empresaFilter) {
      conditions.push(empresaFilter);
    }

    const [articulo] = await db
      .select(selectArticuloColumns)
      .from(articulos)
      .where(and(...conditions))
      .limit(1);

    if (!articulo) {
      throw new NotFoundError(`Artículo con ID ${idArticulo} no encontrado.`);
    }

    res.json(articulo);
  } catch (error) {
    next(error);
  }
});

export default router;
