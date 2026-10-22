'use strict';

const PREVIOUS_ROLES = ['admin', 'finance', 'communication', 'volunteer']

const NEW_ROLES = ['admin', 'finance', 'communication', 'volunteer', 'partner']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Só acrescenta um valor no fim da lista: nenhuma linha muda, e o MySQL não precisa reescrever
    // os papéis que já existem.
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...NEW_ROLES),
      allowNull: false,
      defaultValue: "volunteer",
    })
  },

  async down(queryInterface, Sequelize) {
    // A conta de empresa não tem papel equivalente na lista antiga, então sai antes de o valor
    // deixar o ENUM. O cadastro do parceiro aponta para ela com ON DELETE CASCADE.
    await queryInterface.sequelize.query("DELETE FROM users WHERE role = 'partner'")

    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...PREVIOUS_ROLES),
      allowNull: false,
      defaultValue: "volunteer",
    })
  }
};
