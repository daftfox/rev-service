module.exports = {
    roots: [
        "<rootDir>/src"
    ],
    transform: {
        "^.+\\.ts?$": "ts-jest"
    },
    moduleFileExtensions: [
        'ts',
        'js',
    ],
    coverageDirectory: "coverage",
    collectCoverageFrom: [
        "**/*.ts",
        "!**/major-tom.ts",
        "!**/node_modules/**",
        "!**/test/**"
    ],
    testPathIgnorePatterns: [
        'main.test.ts',
        'config.test.ts'
    ]
};