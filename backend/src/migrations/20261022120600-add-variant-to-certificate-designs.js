'use strict';

const CERTIFICATE_VARIANTS = ['amount', 'message']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cada pasta passa a ter duas variações: a que mostra o valor e a que leva uma mensagem no
    // lugar dele. Toda versão gravada até aqui mostrava o valor.
    await queryInterface.addColumn("certificate_designs", "variant", {
      type: Sequelize.ENUM(...CERTIFICATE_VARIANTS),
      allowNull: false,
      defaultValue: "amount",
      after: "folder",
    })

    // A numeração corre por variação: a versão 2 com mensagem não disputa número com a versão 2
    // com valor. O índice novo entra antes de o antigo sair, para a tabela nunca ficar sem trava.
    await queryInterface.addIndex("certificate_designs", ["folder", "variant", "version"], { unique: true })
    await queryInterface.removeIndex("certificate_designs", ["folder", "version"])

    // O recibo lembra as duas versões com que nasceu, fora do hash, como já fazia com a do valor.
    await queryInterface.addColumn("receipts", "certificate_message_design_id", {
      type: Sequelize.UUID,
      allowNull: true,
      after: "certificate_design_id",
      references: { model: "certificate_designs", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("receipts", "certificate_message_design_id")
    await queryInterface.sequelize.query("DELETE FROM certificate_designs WHERE variant = 'message'")
    await queryInterface.addIndex("certificate_designs", ["folder", "version"], { unique: true })
    await queryInterface.removeIndex("certificate_designs", ["folder", "variant", "version"])
    await queryInterface.removeColumn("certificate_designs", "variant")
  }
};
