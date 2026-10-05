'use strict';

// O recibo grava com qual versão de certificado nasceu. A coluna fica fora do hash de propósito:
// é a roupa do documento, e não o conteúdo assinado, então a corrente não muda por causa dela.
// Recibo emitido antes de existir personalização fica com NULL e sai no modelo de fábrica.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("receipts", "certificate_design_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: { model: "certificate_designs", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("receipts", "certificate_design_id")
  }
};
