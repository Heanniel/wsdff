-- ============================================================================
--  Fase 2 — Limpieza y mejoras de la base de datos (parte segura)
--  Aplicar una sola vez:  node run-migration.js migrations/001_fase2_limpieza_bd.sql
-- ============================================================================

-- 1. Eliminar columnas de stock muertas de `personas`.
--    Nunca se usaron (siempre en 0); el stock real vive en `registro_bombonas`.
ALTER TABLE `personas`
  DROP COLUMN `stock_10kg`,
  DROP COLUMN `stock_18kg`,
  DROP COLUMN `stock_27kg`,
  DROP COLUMN `stock_43kg`;

-- 2. Índices para acelerar las consultas por fecha de pago
--    (compras, historial y estadísticas filtran por `fecha_pago` constantemente).
ALTER TABLE `pagos_bombonas`
  ADD INDEX `idx_registro_fecha` (`id_registro`, `fecha_pago`),
  ADD INDEX `idx_fecha` (`fecha_pago`);

-- 3. Integridad de datos en pagos: monto y método pasan a ser obligatorios.
--    (todas las filas existentes ya tienen valores válidos)
ALTER TABLE `pagos_bombonas`
  MODIFY `monto_pagado` decimal(10,2) NOT NULL,
  MODIFY `metodo_pago` enum('Efectivo','Transferencia','Pago Móvil') NOT NULL;
