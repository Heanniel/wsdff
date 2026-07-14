-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 06-06-2026 a las 16:37:58
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `servicio_comunitario`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estados_civiles`
--

CREATE TABLE `estados_civiles` (
  `id_estado_civil` int(11) NOT NULL,
  `estado_civil` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estados_civiles`
--

INSERT INTO `estados_civiles` (`id_estado_civil`, `estado_civil`) VALUES
(1, 'Soltero/a'),
(2, 'Casado/a'),
(3, 'Divorciado/a'),
(4, 'Viudo/a');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos_bombonas`
--

CREATE TABLE `pagos_bombonas` (
  `id_pago` int(11) NOT NULL,
  `id_registro` int(11) DEFAULT NULL,
  `monto_pagado` decimal(10,2) NOT NULL,
  `metodo_pago` enum('Efectivo','Transferencia','Pago Móvil') NOT NULL,
  `fecha_pago` timestamp NOT NULL DEFAULT current_timestamp(),
  `cant_10kg` int(11) DEFAULT 0,
  `cant_18kg` int(11) DEFAULT 0,
  `cant_27kg` int(11) DEFAULT 0,
  `referencia_texto` varchar(100) DEFAULT NULL,
  `referencia_foto` varchar(255) DEFAULT NULL,
  `cant_43kg` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pagos_bombonas`
--

INSERT INTO `pagos_bombonas` (`id_pago`, `id_registro`, `monto_pagado`, `metodo_pago`, `fecha_pago`, `cant_10kg`, `cant_18kg`, `cant_27kg`, `referencia_texto`, `referencia_foto`, `cant_43kg`) VALUES
(5, 4, 15000.00, 'Efectivo', '2026-05-01 16:43:11', 2, 0, 0, NULL, NULL, 0),
(6, 4, 150000.00, 'Efectivo', '2026-05-01 16:45:10', 0, 0, 2, NULL, NULL, 0),
(8, 7, 600.00, 'Pago Móvil', '2026-05-20 23:10:32', 2, 0, 0, NULL, NULL, 0),
(9, 4, 700.00, 'Pago Móvil', '2026-05-21 01:44:19', 0, 1, 0, '7890', NULL, 0),
(12, 4, 1200.00, 'Pago Móvil', '2026-05-21 02:03:07', 0, 0, 1, '1234', NULL, 0),
(14, 10, 2000.00, 'Pago Móvil', '2026-05-21 15:45:47', 1, 1, 0, '5678', NULL, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `personas`
--

CREATE TABLE `personas` (
  `id_persona` int(11) NOT NULL,
  `cedula` varchar(15) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `sexo` enum('M','F','Otro') NOT NULL,
  `edad` int(11) DEFAULT NULL,
  `id_estado_civil` int(11) DEFAULT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `carga_familiar` int(11) DEFAULT 0,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `calle` enum('Calle 1','Calle 2','Calle 3','Calle 4','Calle 5','Calle 6','Calle 7','Callejón') DEFAULT NULL,
  `estatus` varchar(20) DEFAULT 'Activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `personas`
--

INSERT INTO `personas` (`id_persona`, `cedula`, `nombre`, `apellido`, `sexo`, `edad`, `id_estado_civil`, `celular`, `carga_familiar`, `fecha_registro`, `calle`, `estatus`) VALUES
(3, '11588277', 'LUZ ELENA', 'AZUAJE VARGAS', 'F', 50, 1, '04166524456', 6, '2025-02-11 11:18:12', 'Calle 6', 'Activo'),
(4, '21274188', 'YANYNER CAROLINA', 'QUINTERO  MORILLO', 'F', 36, 4, '04149575080', 4, NULL, 'Calle 1', 'Activo'),
(8, '8106955', 'NERZA', 'QUINTERO', 'F', 57, 1, '04163515057', 2, '2025-02-02 13:28:44', NULL, 'Activo'),
(9, '16867857', 'MARTHA MARIA', 'COLMENAREZ', 'F', 39, 1, '04165592532', 6, '2025-02-11 00:00:00', NULL, 'Activo'),
(10, '9849864', 'EDITH COROMOTO', 'ARANGUREN DE GONZÁLEZ', 'F', 56, 2, '04262551520', 4, NULL, 'Calle 5', 'Activo'),
(11, '4737740', 'GLORIA DEL CARMEN', 'GARCIAS JIMENEZ', 'F', 67, 1, '04267520768', 2, NULL, 'Calle 1', 'Activo'),
(13, '16139421', 'DANYELIS', 'LOPEZ  GARCIAS', 'F', 43, 1, '04266362579', 3, '2025-02-11 00:00:00', NULL, 'Activo'),
(14, '14760665', 'YASMINA DEL CARMEN', 'VIRGUEZ', 'F', 52, 1, '04160371193', 4, '2025-02-11 00:00:00', 'Calle 1', 'Activo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registro_bombonas`
--

CREATE TABLE `registro_bombonas` (
  `id_registro` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `bombonas_10kg` int(11) DEFAULT 0,
  `bombonas_18kg` int(11) DEFAULT 0,
  `bombonas_27kg` int(11) DEFAULT 0,
  `fecha_actualizacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bombonas_43kg` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `registro_bombonas`
--

INSERT INTO `registro_bombonas` (`id_registro`, `id_persona`, `bombonas_10kg`, `bombonas_18kg`, `bombonas_27kg`, `fecha_actualizacion`, `bombonas_43kg`) VALUES
(4, 3, 2, 1, 3, '2026-05-01 13:30:55', 0),
(7, 10, 2, 0, 0, '2026-05-20 18:59:48', 0),
(8, 9, 2, 1, 1, '2026-05-20 21:57:42', 0),
(10, 4, 1, 3, 0, '2026-06-04 10:54:55', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id_rol`, `nombre_rol`) VALUES
(1, 'Administrador'),
(2, 'Secretario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `usuario_login` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

-- NOTA: las contraseñas se guardan hasheadas con bcrypt (nunca en texto plano).
-- Credenciales originales de demo:  admin -> admin123   |   21274188 -> usua123
INSERT INTO `usuarios` (`id_usuario`, `id_persona`, `id_rol`, `usuario_login`, `password_hash`) VALUES
(1, 3, 1, 'admin', '$2b$10$IdAw8yMG.ZFqNeeWe136ue90FZH4eZgpAgpQubGk1R7erxvItbP1y'),
(2, 4, 2, '21274188', '$2b$10$uyrbOB4xmcgyBx56RqGtEuiKmJDzG8PZMsMZYHrq5qmPZiVy9XKcO');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `estados_civiles`
--
ALTER TABLE `estados_civiles`
  ADD PRIMARY KEY (`id_estado_civil`);

--
-- Indices de la tabla `pagos_bombonas`
--
ALTER TABLE `pagos_bombonas`
  ADD PRIMARY KEY (`id_pago`),
  ADD KEY `id_registro` (`id_registro`),
  ADD KEY `idx_registro_fecha` (`id_registro`, `fecha_pago`),
  ADD KEY `idx_fecha` (`fecha_pago`);

--
-- Indices de la tabla `personas`
--
ALTER TABLE `personas`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `cedula` (`cedula`),
  ADD KEY `id_estado_civil` (`id_estado_civil`);

--
-- Indices de la tabla `registro_bombonas`
--
ALTER TABLE `registro_bombonas`
  ADD PRIMARY KEY (`id_registro`),
  ADD KEY `id_persona` (`id_persona`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_rol`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `usuario_login` (`usuario_login`),
  ADD KEY `id_persona` (`id_persona`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `estados_civiles`
--
ALTER TABLE `estados_civiles`
  MODIFY `id_estado_civil` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `pagos_bombonas`
--
ALTER TABLE `pagos_bombonas`
  MODIFY `id_pago` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `personas`
--
ALTER TABLE `personas`
  MODIFY `id_persona` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `registro_bombonas`
--
ALTER TABLE `registro_bombonas`
  MODIFY `id_registro` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `pagos_bombonas`
--
ALTER TABLE `pagos_bombonas`
  ADD CONSTRAINT `pagos_bombonas_ibfk_1` FOREIGN KEY (`id_registro`) REFERENCES `registro_bombonas` (`id_registro`) ON DELETE CASCADE;

--
-- Filtros para la tabla `personas`
--
ALTER TABLE `personas`
  ADD CONSTRAINT `personas_ibfk_1` FOREIGN KEY (`id_estado_civil`) REFERENCES `estados_civiles` (`id_estado_civil`);

--
-- Filtros para la tabla `registro_bombonas`
--
ALTER TABLE `registro_bombonas`
  ADD CONSTRAINT `registro_bombonas_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`) ON DELETE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `personas` (`id_persona`),
  ADD CONSTRAINT `usuarios_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
