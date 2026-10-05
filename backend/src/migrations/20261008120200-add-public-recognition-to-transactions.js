'use strict';

// O consentimento para o nome aparecer no mural de apoiadores. Mora na transação, e não no doador,
// porque é uma decisão por contribuição: quem aceita aparecer na campanha de Natal pode preferir
// não aparecer na próxima. O padrão é `false`: nome em página pública só com escolha expressa.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("transactions", "public_recognition", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("transactions", "public_recognition")
  }
};
