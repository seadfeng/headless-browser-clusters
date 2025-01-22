module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@tests/(.*)$": "<rootDir>/src/__tests__/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
