import { sequelize } from "../../config/sequelize.js";

// Os services de transação rodam dentro de sequelize.transaction() com trava de linha. O teste
// é unitário e não sobe banco, então o callback é executado com um objeto de transação de
// mentira que só precisa carregar o LOCK que os services leem.
export function mockSequelizeTransaction() {
  const fakeTransaction = { LOCK: { UPDATE: "UPDATE" } }

  return jest.spyOn(sequelize, "transaction").mockImplementation(
    (async (callback: (t: unknown) => Promise<unknown>) => callback(fakeTransaction)) as never
  )
}
