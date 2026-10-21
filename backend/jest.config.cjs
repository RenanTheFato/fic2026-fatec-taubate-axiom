module.exports = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/src/tests/**/*.test.ts"],
  // Os testes que desenham um PDF de verdade, com fonte embutida, levam de 4 a
  // 10 s num notebook com Windows rodando o suíte em paralelo. Os 5 s padrão do
  // Jest derrubavam esses testes por tempo, e não por erro.
  testTimeout: 20000,
};
