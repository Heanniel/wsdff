const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db/pool');

// PNG válido de 1x1 px (para probar la subida de fotos).
const PNG = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
    '0000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
    'hex'
);

afterAll(async () => {
    await db.end();
});

describe('Autenticación y seguridad', () => {
    test('GET /personas sin sesión → 401', async () => {
        await request(app).get('/personas').expect(401);
    });

    test('POST /login con credenciales incorrectas → 401', async () => {
        await request(app)
            .post('/login')
            .send({ usuario: 'admin', password: 'incorrecta', role: 'admin' })
            .expect(401);
    });

    test('POST /login admin usando el rol de secretario → 403', async () => {
        await request(app)
            .post('/login')
            .send({ usuario: 'admin', password: 'admin123', role: 'user' })
            .expect(403);
    });

    test('GET /admin.html sin sesión → redirige (302)', async () => {
        await request(app).get('/admin.html').expect(302);
    });

    test('Archivos de servidor bloqueados → 404', async () => {
        await request(app).get('/server.js').expect(404);
        await request(app).get('/src/db/pool.js').expect(404);
        await request(app).get('/.env').expect(404);
    });

    test('Archivos de cliente accesibles → 200', async () => {
        await request(app).get('/scripts.js').expect(200);
    });
});

describe('Sesión de administrador', () => {
    const agent = request.agent(app);

    beforeAll(async () => {
        await agent
            .post('/login')
            .send({ usuario: 'admin', password: 'admin123', role: 'admin' })
            .expect(200);
    });

    test('GET /personas → 200 con lista', async () => {
        const res = await agent.get('/personas').expect(200);
        expect(Array.isArray(res.body.personas)).toBe(true);
        expect(res.body.personas.length).toBeGreaterThan(0);
    });

    test('GET /stats → 200 con contadores', async () => {
        const res = await agent.get('/stats').expect(200);
        expect(res.body).toHaveProperty('total_personas');
        expect(res.body).toHaveProperty('total_admins');
    });

    test('GET /roles → 200', async () => {
        const res = await agent.get('/roles').expect(200);
        expect(Array.isArray(res.body.roles)).toBe(true);
    });

    test('POST /personas con cédula inválida → 400', async () => {
        await agent
            .post('/personas')
            .send({ cedula: 'ABC', nombre: 'Juan', apellido: 'Perez', sexo: 'M' })
            .expect(400);
    });

    test('POST /personas válida → 200 con id_persona', async () => {
        const res = await agent
            .post('/personas')
            .send({ cedula: '99999999', nombre: 'Prueba', apellido: 'Test', sexo: 'M', edad: 30 })
            .expect(200);
        expect(res.body).toHaveProperty('id_persona');
    });

    test('POST /usuarios (admin) → 200', async () => {
        const res = await agent
            .post('/usuarios')
            .send({ id_persona: 8, usuario_login: 'testuser', password: 'clave1234' })
            .expect(200);
        expect(res.body).toHaveProperty('id_usuario');
    });
});

describe('Sesión de secretario', () => {
    const agent = request.agent(app);

    beforeAll(async () => {
        await agent
            .post('/login')
            .send({ usuario: '21274188', password: 'usua123', role: 'user' })
            .expect(200);
    });

    test('POST /usuarios como secretario → 403 (solo admin)', async () => {
        await agent
            .post('/usuarios')
            .send({ id_persona: 8, usuario_login: 'otro', password: 'clave1234' })
            .expect(403);
    });

    test('GET /api/usuario/ventas-calle → 200 con datos', async () => {
        const res = await agent
            .get('/api/usuario/ventas-calle?cedula=21274188')
            .expect(200);
        expect(res.body).toHaveProperty('calle');
        expect(res.body.datos).toHaveProperty('total_ventas');
    });
});

describe('Compras de bombonas', () => {
    const agent = request.agent(app);

    beforeAll(async () => {
        await agent
            .post('/login')
            .send({ usuario: 'admin', password: 'admin123', role: 'admin' })
            .expect(200);
    });

    test('Compra con monto 0 → 400', async () => {
        await agent
            .post('/bombonas/comprar')
            .field('id_registro', '8')
            .field('qty10', '1')
            .field('monto', '0')
            .field('metodo', 'Efectivo')
            .expect(400);
    });

    test('Compra con archivo que no es imagen → 400', async () => {
        await agent
            .post('/bombonas/comprar')
            .field('id_registro', '8')
            .field('qty18', '1')
            .field('monto', '500')
            .field('metodo', 'Efectivo')
            .attach('referencia_foto', Buffer.from('no soy imagen'), { filename: 'x.txt', contentType: 'text/plain' })
            .expect(400);
    });

    test('Compra que excede el stock → 400', async () => {
        await agent
            .post('/bombonas/comprar')
            .field('id_registro', '8')
            .field('qty10', '99')
            .field('monto', '100')
            .field('metodo', 'Efectivo')
            .expect(400);
    });

    test('Compra válida con foto → 200', async () => {
        const res = await agent
            .post('/bombonas/comprar')
            .field('id_registro', '8')
            .field('qty10', '1')
            .field('monto', '500')
            .field('metodo', 'Efectivo')
            .attach('referencia_foto', PNG, { filename: 'ref.png', contentType: 'image/png' })
            .expect(200);
        expect(res.body.message).toMatch(/éxito/i);
    });
});
