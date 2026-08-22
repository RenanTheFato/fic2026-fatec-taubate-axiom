'use strict';

const OLD_ROLES = ['admin', 'staff', 'volunteer']

const NEW_ROLES = ['admin', 'finance', 'communication', 'volunteer']

// A lista de transição precisa ser a união sem repetição: o MySQL recusa um ENUM com valor
// duplicado, e 'admin' e 'volunteer' estão nas duas pontas.
const TRANSITION_ROLES = ['admin', 'staff', 'volunteer', 'finance', 'communication']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // O enum é ampliado antes da troca de valor, senão o UPDATE grava um valor que a coluna
    // ainda não aceita. Só depois de migrar as linhas o valor antigo é retirado da lista.
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...TRANSITION_ROLES),
      allowNull: false,
      defaultValue: "volunteer",
    })

    await queryInterface.sequelize.query(
      "UPDATE users SET role = 'communication' WHERE role = 'staff'"
    )

    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...NEW_ROLES),
      allowNull: false,
      defaultValue: "volunteer",
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...TRANSITION_ROLES),
      allowNull: false,
      defaultValue: "volunteer",
    })

    await queryInterface.sequelize.query(
      "UPDATE users SET role = 'staff' WHERE role IN ('finance', 'communication')"
    )

    await queryInterface.changeColumn("users", "role", {
      type: Sequelize.ENUM(...OLD_ROLES),
      allowNull: false,
      defaultValue: "volunteer",
    })
  }
};
