import React, { useLayoutEffect, useMemo, useRef, useCallback, useEffect } from 'react';
import { PalletPositionWithProducts, ProductInPallet } from '../../../../shared/types';
import { useMainLayoutContext } from '../../layouts/MainLayout';
import { PalletFilaSection } from './PalletFilaSection'; // Import the new component
import { getExpirationStatus, ExpirationStatus } from './PalletTableUtils';

interface PalletProductGridProps {
  data: PalletPositionWithProducts[];
  onAddProduct: (fila: string, posicion: number) => void;
  onRemoveProduct: (fila: string, posicion: number, products: ProductInPallet[]) => void;
  searchQuery: string;
  highlightedProductId: number | null; // Nueva prop
  canModify: boolean; // Nueva prop
}

export const PalletProductGrid: React.FC<PalletProductGridProps> = ({
  data,
  onAddProduct,
  onRemoveProduct,
  searchQuery,
  highlightedProductId, // Desestructurar nueva prop
  canModify, // Desestructurar nueva prop
}) => {
  const { isMobile } = useMainLayoutContext();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // Normalize to local midnight
    return d;
  }, []);

  const positionRefs = useRef(new Map<string | number, HTMLDivElement | null>());
  const productRefs = useRef(new Map<string, HTMLDivElement | null>());
  const observers = useRef(new Map<string | number, ResizeObserver>());

  // scroll antes del paint cuando cambia el grid (usa data como dependencia)
  useLayoutEffect(() => {
    if (isMobile) return; // Skip on mobile

    positionRefs.current.forEach((el) => {
      if (el) el.scrollTop = el.scrollHeight;
    });

    return () => {
      // desconectar observers al desmontar / re-ejecutar
      observers.current.forEach((ro) => ro.disconnect());
      observers.current.clear();
      positionRefs.current.clear();
    };
  }, [data, isMobile]);

  const groupedPositions = useMemo(() => {
    const map = new Map<string, PalletPositionWithProducts[]>();
    data.forEach((pos) => {
      if (!map.has(pos.fila)) {
        map.set(pos.fila, []);
      }
      map.get(pos.fila)?.push(pos);
    });
    return Array.from(map.entries()).sort(([filaA], [filaB]) => filaA.localeCompare(filaB));
  }, [data]);

  const getExpirationStatusForCard = useCallback(
    (dateString: string | null): ExpirationStatus => {
      // Use the centralized function
      return getExpirationStatus(dateString, today);
    },
    [today],
  );

  const doesProductMatchSearch = useCallback((product: ProductInPallet, query: string): boolean => {
    if (!query) return false;
    const lowercasedQuery = query.toLowerCase();
    return (
      (product.desArticulo?.toLowerCase().includes(lowercasedQuery) ?? false) ||
      (product.codigo?.toString().includes(lowercasedQuery) ?? false) ||
      (product.observaciones?.toLowerCase().includes(lowercasedQuery) ?? false)
    );
  }, []);

  useEffect(() => {
    if (isMobile) return;

    if (highlightedProductId !== null) {
      let targetProductKey: string | null = null;
      for (const position of data) {
        const product = position.products.find(
          (p) => String(p.id) === String(highlightedProductId),
        );
        if (product) {
          targetProductKey = `${position.fila}-${position.posicion}-${product.id}`;
          break;
        }
      }

      if (targetProductKey !== null) {
        const targetElement = productRefs.current.get(targetProductKey);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const dom = document.getElementById(`product-${targetProductKey}`);
          if (dom) dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [highlightedProductId, data, isMobile]);

  return (
    <>
      {groupedPositions.map(([fila, positionsInFila]) => (
        <PalletFilaSection
          key={fila}
          fila={fila}
          positionsInFila={positionsInFila}
          onAddProduct={onAddProduct}
          onRemoveProduct={onRemoveProduct}
          searchQuery={searchQuery}
          highlightedProductId={highlightedProductId}
          canModify={canModify}
          getExpirationStatus={getExpirationStatusForCard}
          doesProductMatchSearch={doesProductMatchSearch}
          positionRefs={positionRefs}
          productRefs={productRefs}
        />
      ))}
    </>
  );
};
