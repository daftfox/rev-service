module.exports = {
    roots: [
        '<rootDir>/src',
    ],
    transform: {
        '^.+\\.ts?$': 'ts-jest',
    },
    moduleFileExtensions: [
        'ts',
        'js',
    ],
    collectCoverage: true,
    coverageDirectory: 'reports/coverage',
    collectCoverageFrom: [
        '**/*.ts',
        '!**/major-tom.ts',
        '!**/index.ts',
        '!**/node_modules/**',
        '!**/test/**',
    ],
    reporters: [
        'default',
        'jest-junit',
        [
            'jest-html-reporter',
            {
                pageTitle: 'rev-service test report',
                outputPath: 'reports/test/index.html',
                theme: 'darkTheme',
                dateFormat: 'dd-mm-yyyy HH:MM:ss',
            },
        ],
    ],
};