'use strict';

const CERTIFICATE_SCOPES = ['default', 'campaign', 'event']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cada linha é uma versão, e nenhuma é editada depois de gravada: personalizar de novo é criar
    // a versão seguinte. É o que deixa o histórico inteiro de pé e o certificado de um recibo
    // antigo idêntico ao que o doador recebeu.
    await queryInterface.createTable("certificate_designs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      scope: {
        type: Sequelize.ENUM(...CERTIFICATE_SCOPES),
        allowNull: false,
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "events", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      // A pasta numa coluna só: "default", "campaign:<id>" ou "event:<id>". Existe para o índice
      // único abaixo, porque o MySQL não trata dois NULL como iguais e um índice sobre
      // (scope, campaign_id, version) deixaria passar duas versões 3 do modelo padrão.
      folder: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      version: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      label: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      design: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    })

    await queryInterface.addIndex("certificate_designs", ["folder", "version"], { unique: true })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("certificate_designs")
  }
};
