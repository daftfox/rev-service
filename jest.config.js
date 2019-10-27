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
        "!**/node_modules/**",
        "!**/test/**"
    ]
};