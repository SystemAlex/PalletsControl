import { Router, NextFunction, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { palletsPosiciones, palletsProductos, articulos } from '../db/schema';
import { eq, and, sql, isNotNull } from 'drizzle-orm';
import { UnauthorizedError, BadRequestError } from '../lib/errors';
import { verifyToken } from '../middleware/auth';
import { renewToken } from '../middleware/session';
import {
  AuthRequest,
  UserRole,
  PalletPositionWithProducts,
  ProductInPallet,
  CreateProductInPalletPayload,
} from '../../shared/types';
import {
  createProductInPallet,
  updateProductInPallet,
  deleteProductFromPallet,
} from '../services/palletProductService';

const router = Router();

// Roles permitidos para acceder a esta información
const allowedRoles: UserRole[] = [
  'admin',
  'developer',
  'deposito',
];

// Middleware para verificar roles
const checkRoles = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.role || !allowedRoles.includes(req.user.role)) {
    throw new UnauthorizedError('No tienes permiso para acceder a esta información.');
  }
  next();
};

// Esquema de validación para crear un producto en un pallet
const createProductInPalletSchema = z.object({
  fila: z
    .string()
    .min(1, 'La fila es requerida')
    .max(2, 'La fila no puede tener más de 2 caracteres'),
  posicion: z.coerce
    .number()
    .min(0, 'La posición debe ser un número positivo')
    .max(99999999.99, 'La posición excede el valor máximo permitido'),
  codigo: z.coerce.number().min(1, 'El código de artículo es requerido'),
  bultos: z.coerce.number().min(0, 'La cantidad de bultos debe ser un número positivo o cero'),
  pallets: z.boolean(),
  vencimiento: z.string().nullable().optional(), // Permitir null o undefined
  observaciones: z.string().nullable().optional(),
});

// Esquema de validación para actualizar un producto en un pallet
const updateProductInPalletSchema = z.object({
  bultos: z.coerce
    .number()
    .min(0, 'La cantidad de bultos debe ser un número positivo o cero')
    .optional(),
  pallets: z.boolean().optional(),
  vencimiento: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
});

// GET: Obtener todas las posiciones de pallets habilitadas con sus productos
router.get('/', verifyToken, renewToken, checkRoles, async (req: AuthRequest, res, next) => {
  try {
    // Obtener todas las posiciones habilitadas
    const enabledPositions = await db.query.palletsPosiciones.findMany({
      where: eq(palletsPosiciones.habilitado, true),
      orderBy: [palletsPosiciones.fila, palletsPosiciones.posicion],
    });

    // Obtener todos los productos en pallets que están en posiciones habilitadas
    const productsInPallets = await db
      .select({
        id: palletsProductos.id,
        fila: palletsProductos.fila,
        posicion: sql<string>`${palletsProductos.posicion}`.as('posicion'), // Mantener como string para la unión
        codigo: palletsProductos.codigo,
        desArticulo: articulos.desArticulo,
        bultos: palletsProductos.bultos,
        pallets: palletsProductos.pallets,
        vencimiento: sql<string | null>`${palletsProductos.vencimiento}::text`.as('vencimiento'), // Formatear a ISO string
        observaciones: palletsProductos.observaciones,
      })
      .from(palletsProductos)
      .innerJoin(articulos, eq(palletsProductos.codigo, articulos.idArticulo))
      .innerJoin(
        palletsPosiciones,
        and(
          eq(palletsProductos.fila, palletsPosiciones.fila),
          eq(palletsProductos.posicion, palletsPosiciones.posicion),
          eq(palletsPosiciones.habilitado, true), // Solo productos en posiciones habilitadas
        ),
      )
      .where(isNotNull(articulos.desArticulo)); // Asegurarse de que el artículo exista

    // Mapear productos a sus posiciones
    const productsMap = new Map<string, ProductInPallet[]>();
    productsInPallets.forEach((product) => {
      const key = `${product.fila}-${product.posicion}`;
      if (!productsMap.has(key)) {
        productsMap.set(key, []);
      }
      productsMap.get(key)?.push({
        id: product.id,
        codigo: product.codigo,
        desArticulo: product.desArticulo,
        bultos: product.bultos,
        pallets: product.pallets,
        vencimiento: product.vencimiento,
        observaciones: product.observaciones,
      });
    });

    // Construir la respuesta final, incluyendo posiciones vacías
    const result: PalletPositionWithProducts[] = enabledPositions.map((pos) => {
      const key = `${pos.fila}-${pos.posicion}`;
      return {
        id: pos.id,
        fila: pos.fila,
        posicion: parseFloat(pos.posicion), // Convertir a number para el frontend
        habilitado: pos.habilitado,
        products: productsMap.get(key) || [], // Si no hay productos, devuelve un array vacío
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST: Añadir un producto a una posición de pallet
router.post('/', verifyToken, renewToken, checkRoles, async (req: AuthRequest, res, next) => {
  try {
    const validation = createProductInPalletSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const userId = req.user?.id;
    const username = req.user?.username;
    const realname = req.user?.realname;
    if (!userId || !username || !realname) {
      throw new UnauthorizedError('Usuario no autenticado.');
    }

    // Asegurarse de que vencimiento sea string | null antes de pasarlo al servicio
    const payloadWithNormalizedVencimiento: CreateProductInPalletPayload = {
      ...validation.data,
      vencimiento: validation.data.vencimiento === undefined ? null : validation.data.vencimiento,
    };

    const newProduct = await createProductInPallet(
      payloadWithNormalizedVencimiento,
      userId,
      username,
      realname,
    );

    res
      .status(201)
      .json({ message: 'Producto añadido al pallet exitosamente', product: newProduct });
  } catch (error) {
    next(error);
  }
});

// PATCH: Actualizar un producto en un pallet por su ID
router.patch('/:id', verifyToken, renewToken, checkRoles, async (req: AuthRequest, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      throw new BadRequestError('ID de producto inválido.');
    }

    const userId = req.user?.id;
    const username = req.user?.username;
    const realname = req.user?.realname;
    if (!userId || !username || !realname) {
      throw new UnauthorizedError('Usuario no autenticado.');
    }

    const validation = updateProductInPalletSchema.safeParse(req.body);
    if (!validation.success) {
      throw new BadRequestError(validation.error.errors.map((e) => e.message).join(', '));
    }

    const updatedProduct = await updateProductInPallet(
      productId,
      validation.data,
      userId,
      username,
      realname,
    );

    res.status(200).json({ message: 'Producto actualizado exitosamente', product: updatedProduct });
  } catch (error) {
    next(error);
  }
});

// DELETE: Eliminar un producto de un pallet por su ID
router.delete('/:id', verifyToken, renewToken, checkRoles, async (req: AuthRequest, res, next) => {
  try {
    const productId = parseInt(req.params.id, 10);
    if (isNaN(productId)) {
      throw new BadRequestError('ID de producto inválido.');
    }

    const userId = req.user?.id;
    const username = req.user?.username;
    const realname = req.user?.realname;
    if (!userId || !username || !realname) {
      throw new UnauthorizedError('Usuario no autenticado.');
    }

    const deletedProduct = await deleteProductFromPallet(productId, userId, username, realname);

    res
      .status(200)
      .json({ message: 'Producto eliminado del pallet exitosamente', product: deletedProduct });
  } catch (error) {
    next(error);
  }
});

export default router;