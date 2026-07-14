module.exports = {
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/tests/env.js'],
    globalSetup: '<rootDir>/tests/globalSetup.js',
    globalTeardown: '<rootDir>/tests/globalTeardown.js',
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    // El pool de MySQL puede dejar un handle abierto; se cierra en afterAll,
    // y forceExit sirve de red de seguridad.
    forceExit: true
};
