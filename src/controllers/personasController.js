// ============================================================================
//  Controlador de personas
// ============================================================================
const db = require('../db/pool');

const regexLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const regexNumeros = /^\d+$/;

// OBTENER TODAS LAS PERSONAS
async function obtenerTodas(req, res) {
    const query = `
        SELECT p.*, ec.estado_civil
        FROM personas p
        LEFT JOIN estados_civiles ec ON p.id_estado_civil = ec.id_estado_civil
        ORDER BY p.fecha_registro DESC
    `;
    try {
        const [results] = await db.query(query);
        res.json({ personas: results });
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener personas' });
    }
}

// OBTENER PERSONAS SIN REGISTRO DE BOMBONAS (con filtro opcional por calle)
async function obtenerSinBombonas(req, res) {
    const { calle } = req.query;
    let query = `
        SELECT p.id_persona, p.cedula, p.nombre, p.apellido, p.calle
        FROM personas p
        WHERE p.id_persona NOT IN (SELECT id_persona FROM registro_bombonas)
    `;
    const params = [];
    if (calle && calle !== 'null' && calle !== 'undefined') {
        query += ` AND p.calle = ?`;
        params.push(calle);
    }
    try {
        const [results] = await db.query(query, params);
        res.json({ personas: results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}

// CREAR PERSONA
async function crear(req, res) {
    const { cedula, nombre, apellido, sexo, edad, id_estado_civil, celular, carga_familiar, calle } = req.body;

    if (!cedula || !nombre || !apellido || !sexo) {
        return res.status(400).json({ error: 'Cédula, nombre, apellido y sexo son requeridos' });
    }
    // Validaciones de formato (mismas reglas que en la edición, para mantener consistencia).
    if (!regexNumeros.test(cedula)) {
        return res.status(400).json({ error: 'La cédula debe contener únicamente números.' });
    }
    if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
        return res.status(400).json({ error: 'El nombre y el apellido solo deben contener letras.' });
    }
    if (edad && (parseInt(edad) < 0 || parseInt(edad) > 120)) {
        return res.status(400).json({ error: 'La edad proporcionada no es válida.' });
    }
    if (celular && !regexNumeros.test(celular)) {
        return res.status(400).json({ error: 'El celular debe contener únicamente números.' });
    }

    const query = `INSERT INTO personas (cedula, nombre, apellido, sexo, edad, id_estado_civil, celular, carga_familiar, calle)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    try {
        const id = await db.insertReturningId(
            query,
            [cedula, nombre, apellido, sexo, edad || null, id_estado_civil || 1, celular || null, carga_familiar || 0, calle || null],
            'id_persona'
        );
        res.json({ message: 'Usuario registrado correctamente en el sistema.', id_persona: id });
    } catch (err) {
        if (db.isDuplicateError(err)) {
            return res.status(409).json({ error: 'Ya existe una persona con esa cédula' });
        }
        console.error('Error al crear persona:', err);
        res.status(500).json({ error: 'Error al crear persona' });
    }
}

// ACTUALIZAR/EDITAR PERSONA
async function actualizar(req, res) {
    const { id_persona } = req.params;
    const { cedula, nombre, apellido, sexo, edad, id_estado_civil, celular, carga_familiar, calle, estatus, fecha_registro } = req.body;

    if (!cedula || !nombre || !apellido || !sexo) {
        return res.status(400).json({ error: 'Cédula, nombre, apellido y sexo son requeridos' });
    }
    if (!regexNumeros.test(cedula)) {
        return res.status(400).json({ error: 'La cédula debe contener únicamente números.' });
    }
    if (!regexLetras.test(nombre) || !regexLetras.test(apellido)) {
        return res.status(400).json({ error: 'El nombre y el apellido solo deben contener letras.' });
    }
    if (edad && (parseInt(edad) < 0 || parseInt(edad) > 120)) {
        return res.status(400).json({ error: 'La edad proporcionada no es válida.' });
    }

    const query = `
        UPDATE personas
        SET cedula = ?, nombre = ?, apellido = ?, sexo = ?, edad = ?, id_estado_civil = ?,
            celular = ?, carga_familiar = ?, calle = ?, estatus = ?, fecha_registro = ?
        WHERE id_persona = ?
    `;
    const valores = [
        cedula, nombre, apellido, sexo, edad || null, id_estado_civil || 1,
        celular || null, carga_familiar || 0, calle || null, estatus || 'Activo', fecha_registro, id_persona
    ];

    try {
        const [, meta] = await db.query(query, valores);
        if (meta.affectedRows === 0) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        res.json({ message: 'Persona actualizada exitosamente' });
    } catch (err) {
        if (db.isDuplicateError(err)) {
            return res.status(409).json({ error: 'Ya existe otra persona con esa cédula registrada' });
        }
        console.error('Error al actualizar persona:', err);
        res.status(500).json({ error: 'Error al actualizar los datos en la base de datos' });
    }
}

module.exports = { obtenerTodas, obtenerSinBombonas, crear, actualizar };
