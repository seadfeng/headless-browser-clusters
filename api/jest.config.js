module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@tests/(.*)$": "<rootDir>/app/__tests__/$1",
    "^@/(.*)$": "<rootDir>/app/$1",
  },
};
