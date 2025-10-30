import { db } from '../db';
import { palletsProductos, articulos, palletActionLogs, palletsPosiciones } from '../db/schema';
import {
  CreateProductInPalletPayload,
  UpdateProductInPalletPayload,
  ProductInPallet,
} from '../../shared/types';
import { BadRequestError, NotFoundError } from '../lib/errors';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns'; // Importar format de date-fns

// Helper function to format product details into a readable string for logs
function formatProductLogString(
  fila: string,
  posicion: string | number, // Can be string from DB or number from payload
  product: {
    codigo: number;
    desArticulo?: string | null; // Optional as it might not be available for existingPalletProduct directly
    bultos: number;
    vencimiento: Date | string | null; // Can be Date object from DB or ISO string from payload
  },
): string {
  const formattedPosicion = typeof posicion === 'number' ? posicion : parseFloat(posicion);
  const vencimientoStr = product.vencimiento
    ? format(new Date(product.vencimiento), 'dd/MM/yyyy')
    : 'N/A';
  const desArticulo = product.desArticulo || 'Artículo Desconocido'; // Fallback if desArticulo is not provided
  return `${fila}${formattedPosicion} - ${desArticulo} (${product.codigo}) - ${product.bultos} bultos - vto ${vencimientoStr}`;
}

export async function createProductInPallet(
  payload: CreateProductInPalletPayload,
  userId: number,
  username: string,
  realname: string,
) {
  // Validate payload
  if (!payload.fila || !payload.posicion || !payload.codigo || payload.bultos === undefined) {
    throw new BadRequestError('Faltan datos obligatorios para crear el producto en pallet.');
  }

  // Ensure position is formatted correctly (e.g., 22 -> '22.00')
  const formattedPosicion = payload.posicion.toFixed(2);

  try {
    const [newProductRaw] = await db
      .insert(palletsProductos)
      .values({
        fila: payload.fila,
        posicion: formattedPosicion,
        codigo: payload.codigo,
        bultos: payload.bultos,
        pallets: payload.pallets,
        vencimiento: payload.vencimiento ? new Date(payload.vencimiento + 'T00:00:00Z') : null,
        observaciones: payload.observaciones,
        userId: userId,
      })
      .returning();

    if (!newProductRaw) {
      throw new Error('Failed to create product in pallet.');
    }

    // Fetch desArticulo for the response
    const articulo = await db.query.articulos.findFirst({
      where: eq(articulos.idArticulo, newProductRaw.codigo),
    });

    const newProduct: ProductInPallet = {
      id: newProductRaw.id,
      codigo: newProductRaw.codigo,
      desArticulo: articulo?.desArticulo || 'Desconocido',
      bultos: newProductRaw.bultos,
      pallets: newProductRaw.pallets,
      vencimiento: newProductRaw.vencimiento?.toISOString().split('T')[0] || null,
      observaciones: newProductRaw.observaciones,
    };

    // Log the action with readable string
    const displayPosicion =
      typeof newProductRaw.posicion === 'string'
        ? parseFloat(newProductRaw.posicion).toString()
        : String(newProductRaw.posicion);

    await db.insert(palletActionLogs).values({
      palletProductId: newProduct.id,
      palletPositionId: null, // No direct position ID for product creation
      actionType: 'ADD_PRODUCT',
      description: `Producto Subido: ${newProduct.desArticulo} (${newProduct.codigo}) en ${newProductRaw.fila}${displayPosicion}`,
      oldValue: null,
      newValue: formatProductLogString(newProductRaw.fila, newProductRaw.posicion, {
        codigo: newProductRaw.codigo,
        desArticulo: articulo?.desArticulo,
        bultos: newProductRaw.bultos,
        vencimiento: newProductRaw.vencimiento,
      }),
      userId: userId,
      username: username,
      realname: realname,
    });

    return newProduct;
  } catch (error) {
    console.error('Error creating product in pallet:', error);
    throw error;
  }
}

export async function updateProductInPallet(
  productId: number,
  payload: UpdateProductInPalletPayload,
  userId: number,
  username: string,
  realname: string,
): Promise<ProductInPallet> {
  const existingProduct = await db.query.palletsProductos.findFirst({
    where: eq(palletsProductos.id, productId),
  });

  if (!existingProduct) {
    throw new NotFoundError('Producto no encontrado en el pallet.');
  }

  // Fetch desArticulo for existing product before update
  const existingArticulo = await db.query.articulos.findFirst({
    where: eq(articulos.idArticulo, existingProduct.codigo),
  });

  const oldProductLogString = formatProductLogString(
    existingProduct.fila,
    existingProduct.posicion,
    {
      codigo: existingProduct.codigo,
      desArticulo: existingArticulo?.desArticulo,
      bultos: existingProduct.bultos,
      vencimiento: existingProduct.vencimiento,
    },
  );

  // If bultos is updated to 0, set pallets to false
  const updatedPallets = payload.bultos === 0 ? false : existingProduct.pallets; // Keep existing pallets if not explicitly changed

  const [updatedProductRaw] = await db
    .update(palletsProductos)
    .set({
      bultos: payload.bultos,
      pallets: updatedPallets, // Use the potentially updated pallets value
      userId: userId, // Update userId to the current user performing the action
      updatedAt: new Date(),
    })
    .where(eq(palletsProductos.id, productId))
    .returning();

  if (!updatedProductRaw) {
    throw new NotFoundError('Producto no encontrado en el pallet o no se pudo actualizar.');
  }

  const articulo = await db.query.articulos.findFirst({
    where: eq(articulos.idArticulo, updatedProductRaw.codigo),
  });

  const updatedProduct: ProductInPallet = {
    id: updatedProductRaw.id,
    codigo: updatedProductRaw.codigo,
    desArticulo: articulo?.desArticulo || 'Desconocido',
    bultos: updatedProductRaw.bultos,
    pallets: updatedProductRaw.pallets,
    vencimiento: updatedProductRaw.vencimiento?.toISOString().split('T')[0] || null,
    observaciones: updatedProductRaw.observaciones,
  };

  const displayPosicion =
    typeof existingProduct.posicion === 'string'
      ? parseFloat(existingProduct.posicion).toString()
      : String(existingProduct.posicion);

  // Log the action with readable string
  await db.insert(palletActionLogs).values({
    palletProductId: updatedProduct.id,
    palletPositionId: null,
    actionType: 'UPDATE_PRODUCT',
    description: `Producto actualizado: ${updatedProduct.desArticulo} (${updatedProduct.codigo}) en ${existingProduct.fila}${displayPosicion}`,
    oldValue: oldProductLogString,
    newValue: formatProductLogString(updatedProductRaw.fila, updatedProductRaw.posicion, {
      codigo: updatedProductRaw.codigo,
      desArticulo: articulo?.desArticulo,
      bultos: updatedProductRaw.bultos,
      vencimiento: updatedProductRaw.vencimiento,
    }),
    userId: userId,
    username: username,
    realname: realname,
  });

  return updatedProduct;
}

export async function deleteProductFromPallet(
  palletProductId: number,
  userId: number,
  username: string,
  realname: string,
) {
  // Recuperar el registro antes de borrarlo
  const existingPalletProduct = await db.query.palletsProductos.findFirst({
    where: eq(palletsProductos.id, palletProductId),
  });

  if (!existingPalletProduct) {
    throw new NotFoundError('Producto en pallet no encontrado.');
  }

  // Intentar obtener descripción del artículo
  const articulo = await db.query.articulos.findFirst({
    where: eq(articulos.idArticulo, existingPalletProduct.codigo),
  });

  // Buscar la posición correspondiente (si existe) para obtener su id
  const position = await db.query.palletsPosiciones.findFirst({
    where: and(
      eq(palletsPosiciones.fila, existingPalletProduct.fila),
      eq(palletsPosiciones.posicion, existingPalletProduct.posicion),
    ),
  });

  const oldProductLogString = formatProductLogString(
    existingPalletProduct.fila,
    existingPalletProduct.posicion,
    {
      codigo: existingPalletProduct.codigo,
      desArticulo: articulo?.desArticulo,
      bultos: existingPalletProduct.bultos,
      vencimiento: existingPalletProduct.vencimiento,
    },
  );

  const displayPosicion =
    typeof existingPalletProduct.posicion === 'string'
      ? parseFloat(existingPalletProduct.posicion).toString()
      : String(existingPalletProduct.posicion);

  // Loguear la acción ANTES de eliminar para evitar violación de FK
  await db.insert(palletActionLogs).values({
    palletProductId: existingPalletProduct.id,
    palletPositionId: position?.id ?? null,
    actionType: 'DELETE_PRODUCT',
    description: `Producto Bajado: ${articulo?.desArticulo || existingPalletProduct.codigo} (${existingPalletProduct.codigo}) de ${existingPalletProduct.fila}${displayPosicion}`,
    oldValue: oldProductLogString,
    newValue: null,
    userId: userId,
    username: username,
    realname: realname,
  });

  // Ahora sí eliminar el producto del pallet
  await db.delete(palletsProductos).where(eq(palletsProductos.id, palletProductId));
}
