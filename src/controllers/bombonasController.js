// ============================================================================
//  Controlador de bombonas (inventario, compras/pagos y estadísticas)
// ============================================================================
const fs = require('fs');
const db = require('../db/pool');

const CALLES = ['Calle 1', 'Calle 2', 'Calle 3', 'Calle 4', 'Calle 5', 'Calle 6', 'Calle 7', 'Callejón'];

// OBTENER TOTALES DE BOMBONAS
async function obtenerTotales(req, res) {
    const query = `
        SELECT SUM(bombonas_10kg) as total_10kg, SUM(bombonas_18kg) as total_18kg,
               SUM(bombonas_27kg) as total_27kg, SUM(bombonas_43kg) as total_43kg
        FROM registro_bombonas
    `;
    try {
        const [results] = await db.query(query);
        res.json(results[0] || { total_10kg: 0, total_18kg: 0, total_27kg: 0, total_43kg: 0 });
    } catch (e) {
        console.error('Error en totales:', e);
        res.status(500).json({ error: 'Error al calcular totales' });
    }
}

// REGISTRAR BOMBONAS (inventario de un beneficiario)
async function registrar(req, res) {
    const { id_persona, bombonas_10kg, bombonas_18kg, bombonas_27kg, bombonas_43kg } = req.body;
    if (!id_persona) return res.status(400).json({ error: 'Persona no seleccionada' });

    const query = `INSERT INTO registro_bombonas (id_persona, bombonas_10kg, bombonas_18kg, bombonas_27kg, bombonas_43kg) VALUES (?, ?, ?, ?, ?)`;
    try {
        await db.query(query, [id_persona, bombonas_10kg || 0, bombonas_18kg || 0, bombonas_27kg || 0, bombonas_43kg || 0]);
        res.json({ message: '¡Inventario registrado con éxito!' });
    } catch (err) {
        console.error('Error SQL al insertar:', err);
        res.status(500).json({ error: 'Error al insertar: ' + err.message });
    }
}

// OBTENER TABLA DETALLADA (con filtro opcional por calle)
async function obtenerDetallado(req, res) {
    const { calle } = req.query;
    let query = `
        SELECT p.cedula, p.nombre, p.apellido, p.sexo, p.edad, p.celular, rb.id_registro, p.calle,
               rb.bombonas_10kg, rb.bombonas_18kg, rb.bombonas_27kg, rb.bombonas_43kg, rb.fecha_actualizacion as fecha_registro
        FROM registro_bombonas rb
        JOIN personas p ON rb.id_persona = p.id_persona
    `;
    const params = [];
    if (calle && calle !== 'null' && calle !== 'undefined') {
        query += ` WHERE p.calle = ?`;
        params.push(calle);
    }
    query += ` ORDER BY rb.fecha_actualizacion DESC`;
    try {
        const [results] = await db.query(query, params);
        res.json({ registros: results });
    } catch (e) {
        console.error('Error en tabla detallada:', e);
        res.status(500).json({ error: 'Error al obtener tabla' });
    }
}

// ACTUALIZAR INVENTARIO DE UN REGISTRO
async function actualizar(req, res) {
    const { id_registro, bombonas_10kg, bombonas_18kg, bombonas_27kg, bombonas_43kg } = req.body;
    const query = `UPDATE registro_bombonas SET bombonas_10kg=?, bombonas_18kg=?, bombonas_27kg=?, bombonas_43kg=? WHERE id_registro=?`;
    try {
        await db.query(query, [bombonas_10kg, bombonas_18kg, bombonas_27kg, bombonas_43kg, id_registro]);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).send(err);
    }
}

// ELIMINAR UN REGISTRO
async function eliminar(req, res) {
    try {
        await db.query('DELETE FROM registro_bombonas WHERE id_registro = ?', [req.params.id]);
        res.json({ status: 'ok' });
    } catch (err) {
        res.status(500).send(err);
    }
}

// REGISTRAR COMPRA Y PAGO
// Usa una transacción con bloqueo de fila (FOR UPDATE) para evitar sobreventa
// por compras simultáneas. La foto ya fue procesada por el middleware multer.
async function comprar(req, res) {
    const { id_registro, referencia_texto } = req.body;
    const qty10 = parseInt(req.body.qty10) || 0;
    const qty18 = parseInt(req.body.qty18) || 0;
    const qty27 = parseInt(req.body.qty27) || 0;
    const qty43 = parseInt(req.body.qty43) || 0;
    const monto = parseFloat(req.body.monto);
    const metodo = req.body.metodo;
    const referencia_foto = req.file ? `/uploads/referencias/${req.file.filename}` : null;

    // Si se rechaza la compra, borra la imagen recién subida para no dejar huérfanos.
    const limpiarArchivo = () => { if (req.file) fs.unlink(req.file.path, () => {}); };

    if (!id_registro) { limpiarArchivo(); return res.status(400).json({ error: 'Registro no especificado.' }); }
    if (isNaN(monto) || monto <= 0) { limpiarArchivo(); return res.status(400).json({ error: 'El monto pagado es obligatorio y debe ser mayor que 0.' }); }
    const metodosValidos = ['Efectivo', 'Transferencia', 'Pago Móvil'];
    if (!metodo || !metodosValidos.includes(metodo)) { limpiarArchivo(); return res.status(400).json({ error: 'El método de pago es obligatorio y debe ser válido.' }); }

    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();

        // Bloquea la fila del registro para serializar compras simultáneas (anti-sobreventa).
        const [regRows] = await conn.query(
            'SELECT bombonas_10kg, bombonas_18kg, bombonas_27kg, bombonas_43kg FROM registro_bombonas WHERE id_registro = ? FOR UPDATE',
            [id_registro]
        );
        if (regRows.length === 0) {
            await conn.rollback();
            limpiarArchivo();
            return res.status(404).json({ error: 'Registro no encontrado.' });
        }
        const reg = regRows[0];

        // Cantidades ya compradas en los últimos 7 días (leído dentro de la transacción).
        const [compRows] = await conn.query(
            `SELECT COALESCE(SUM(cant_10kg),0) c10, COALESCE(SUM(cant_18kg),0) c18,
                    COALESCE(SUM(cant_27kg),0) c27, COALESCE(SUM(cant_43kg),0) c43
             FROM pagos_bombonas
             WHERE id_registro = ? AND fecha_pago > ${db.dateDaysAgo(7)}`,
            [id_registro]
        );
        const comp = compRows[0];
        const disp10 = reg.bombonas_10kg - comp.c10;
        const disp18 = reg.bombonas_18kg - comp.c18;
        const disp27 = reg.bombonas_27kg - comp.c27;
        const disp43 = reg.bombonas_43kg - comp.c43;

        const validarDisp = (qty, disp, tam) => {
            if (qty > 0 && disp <= 0) return `Ya compró sus bombonas de ${tam}.`;
            if (qty > disp) {
                const msg = disp === 1 ? 'una sola bombona registrada' : `${disp} bombonas registradas`;
                return `Solo tiene ${msg} de tamaño ${tam}.`;
            }
            return null;
        };
        const errDisp = validarDisp(qty10, disp10, '10kg') || validarDisp(qty18, disp18, '18kg')
                     || validarDisp(qty27, disp27, '27kg') || validarDisp(qty43, disp43, '43kg');
        if (errDisp) {
            await conn.rollback();
            limpiarArchivo();
            return res.status(400).json({ error: errDisp });
        }

        // ¿Inicia un nuevo lote de ventas? (sin compras en los últimos 15 días)
        const periodoLoteDias = 15;
        const [loteRows] = await conn.query(
            `SELECT COUNT(*) as total FROM pagos_bombonas WHERE fecha_pago > ${db.dateDaysAgo(periodoLoteDias)}`,
            []
        );
        const esNuevoLote = Number(loteRows[0].total) === 0;

        await conn.query(
            `INSERT INTO pagos_bombonas (id_registro, monto_pagado, metodo_pago, cant_10kg, cant_18kg, cant_27kg, cant_43kg, referencia_texto, referencia_foto)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id_registro, monto, metodo, qty10, qty18, qty27, qty43, referencia_texto || null, referencia_foto]
        );

        await conn.commit();
        res.json({
            message: '¡Compra procesada con éxito!',
            actualizar_estadisticas: esNuevoLote,
            periodo_lote_dias: periodoLoteDias
        });
    } catch (e) {
        if (conn) { try { await conn.rollback(); } catch (_) {} }
        limpiarArchivo();
        console.error('Error en /bombonas/comprar:', e);
        res.status(500).json({ error: 'Error al procesar la compra.' });
    } finally {
        if (conn) conn.release();
    }
}

// HISTORIAL DE VENTAS REALES (con filtro por calle y periodo)
async function obtenerHistorial(req, res) {
    const { calle, periodo } = req.query;
    let query = `
        SELECT p.id_persona, p.cedula, p.nombre, p.apellido, pb.monto_pagado, pb.metodo_pago, pb.fecha_pago, p.calle,
               pb.cant_10kg, pb.cant_18kg, pb.cant_27kg, pb.cant_43kg, pb.referencia_texto, pb.referencia_foto
        FROM pagos_bombonas pb
        JOIN registro_bombonas rb ON pb.id_registro = rb.id_registro
        JOIN personas p ON rb.id_persona = p.id_persona
    `;
    const params = [];
    const condiciones = [];
    if (periodo && !isNaN(parseInt(periodo))) {
        condiciones.push(`pb.fecha_pago > ${db.dateDaysAgo(parseInt(periodo))}`);
    }
    if (calle && calle !== 'null' && calle !== 'undefined') {
        condiciones.push('p.calle = ?');
        params.push(calle);
    }
    if (condiciones.length > 0) {
        query += ` WHERE ${condiciones.join(' AND ')}`;
    }
    query += ` ORDER BY pb.fecha_pago DESC`;
    try {
        const [results] = await db.query(query, params);
        res.json({ historial: results });
    } catch (e) {
        console.error('Error al obtener historial:', e);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
}

// ESTADÍSTICAS POR CALLE (inventario)
async function obtenerEstadisticasCalles(req, res) {
    const query = `
        SELECT
            p.calle,
            COUNT(DISTINCT p.id_persona) as total_personas,
            COUNT(DISTINCT CASE WHEN rb.id_registro IS NOT NULL THEN p.id_persona END) as personas_con_registro,
            SUM(COALESCE(rb.bombonas_10kg, 0)) as total_10kg,
            SUM(COALESCE(rb.bombonas_18kg, 0)) as total_18kg,
            SUM(COALESCE(rb.bombonas_27kg, 0)) as total_27kg,
            SUM(COALESCE(rb.bombonas_43kg, 0)) as total_43kg,
            SUM(COALESCE(rb.bombonas_10kg, 0) + COALESCE(rb.bombonas_18kg, 0) + COALESCE(rb.bombonas_27kg, 0) + COALESCE(rb.bombonas_43kg, 0)) as total_cilindros
        FROM personas p
        LEFT JOIN registro_bombonas rb ON p.id_persona = rb.id_persona
        GROUP BY p.calle
        ORDER BY ${db.orderByCalle('p.calle')}
    `;
    try {
        const [results] = await db.query(query);
        const estadisticasCompletas = CALLES.map(calle => {
            const encontrado = results.find(r => r.calle === calle);
            if (encontrado) return encontrado;
            return {
                calle, total_personas: 0, personas_con_registro: 0,
                total_10kg: 0, total_18kg: 0, total_27kg: 0, total_43kg: 0, total_cilindros: 0
            };
        });
        res.json({ estadisticas: estadisticasCompletas });
    } catch (e) {
        console.error('Error al obtener estadísticas por calle:', e);
        res.status(500).json({ error: 'Error al obtener estadísticas por calle' });
    }
}

// ESTADÍSTICAS DE VENTAS POR CALLE (últimos 15 días)
async function obtenerEstadisticasVentasCalles(req, res) {
    const { calle } = req.query;
    const periodoDias = 15;
    let query = `
        SELECT p.calle, pb.cant_10kg, pb.cant_18kg, pb.cant_27kg, pb.cant_43kg, pb.monto_pagado
        FROM pagos_bombonas pb
        JOIN registro_bombonas rb ON pb.id_registro = rb.id_registro
        JOIN personas p ON rb.id_persona = p.id_persona
        WHERE pb.fecha_pago > ${db.dateDaysAgo(periodoDias)}
    `;
    const params = [];
    if (calle && calle !== 'null' && calle !== 'undefined') {
        query += ` AND p.calle = ?`;
        params.push(calle);
    }

    try {
        const [results] = await db.query(query, params);
        const calles = (calle && calle !== 'null' && calle !== 'undefined') ? [calle] : CALLES;

        const statsMap = {};
        calles.forEach(c => {
            statsMap[c] = {
                calle: c, total_10kg: 0, total_18kg: 0, total_27kg: 0, total_43kg: 0, total_bombonas: 0,
                monto_10kg: 0, monto_18kg: 0, monto_27kg: 0, monto_43kg: 0, total_monto: 0
            };
        });

        results.forEach(row => {
            const c = row.calle;
            if (!statsMap[c]) return;
            const qty10 = parseInt(row.cant_10kg) || 0;
            const qty18 = parseInt(row.cant_18kg) || 0;
            const qty27 = parseInt(row.cant_27kg) || 0;
            const qty43 = parseInt(row.cant_43kg) || 0;
            const totalCils = qty10 + qty18 + qty27 + qty43;
            const monto = parseFloat(row.monto_pagado) || 0;

            statsMap[c].total_10kg += qty10;
            statsMap[c].total_18kg += qty18;
            statsMap[c].total_27kg += qty27;
            statsMap[c].total_43kg += qty43;
            statsMap[c].total_bombonas += totalCils;
            statsMap[c].total_monto += monto;

            if (totalCils > 0) {
                statsMap[c].monto_10kg += monto * (qty10 / totalCils);
                statsMap[c].monto_18kg += monto * (qty18 / totalCils);
                statsMap[c].monto_27kg += monto * (qty27 / totalCils);
                statsMap[c].monto_43kg += monto * (qty43 / totalCils);
            }
        });

        res.json({
            estadisticas: calles.map(c => statsMap[c]),
            periodo_dias: periodoDias,
            actualizado: new Date().toISOString()
        });
    } catch (e) {
        console.error('Error al obtener estadísticas de ventas por calle:', e);
        res.status(500).json({ error: 'Error al obtener estadísticas de ventas por calle' });
    }
}

// BALANCE DE VENTAS DE LA CALLE DEL SECRETARIO (módulo del usuario)
async function obtenerVentasCalleUsuario(req, res) {
    const cedulaUsuario = req.query.cedula;
    if (!cedulaUsuario || cedulaUsuario === 'undefined' || cedulaUsuario === 'null') {
        return res.status(400).json({ error: 'Cédula de usuario no válida o ausente' });
    }

    try {
        const [usuarios] = await db.query('SELECT id_persona, calle FROM personas WHERE cedula = ?', [cedulaUsuario]);
        if (usuarios.length === 0 || !usuarios[0].calle) {
            return res.status(404).json({ error: 'El usuario no tiene una calle asignada en el sistema' });
        }
        const miCalle = usuarios[0].calle;

        // COUNT(DISTINCT ...) evita que el LEFT JOIN con varios pagos por registro infle los conteos.
        const query = `
            SELECT
                COUNT(DISTINCT rb.id_registro) as total_ventas,
                COUNT(DISTINCT CASE WHEN pb.id_pago IS NOT NULL THEN rb.id_registro END) as pagadas,
                COUNT(DISTINCT CASE WHEN pb.id_pago IS NULL THEN rb.id_registro END) as pendientes,
                COALESCE(SUM(pb.monto_pagado), 0) as total_dinero
            FROM personas p
            LEFT JOIN registro_bombonas rb ON p.id_persona = rb.id_persona
            LEFT JOIN pagos_bombonas pb ON rb.id_registro = pb.id_registro
            WHERE p.calle = ?
        `;
        const [stats] = await db.query(query, [miCalle]);
        res.json({ calle: miCalle, datos: stats[0] });
    } catch (e) {
        console.error('Error en ventas-calle:', e);
        res.status(500).json({ error: 'Error interno en la base de datos' });
    }
}

module.exports = {
    obtenerTotales, registrar, obtenerDetallado, actualizar, eliminar, comprar,
    obtenerHistorial, obtenerEstadisticasCalles, obtenerEstadisticasVentasCalles, obtenerVentasCalleUsuario
};
