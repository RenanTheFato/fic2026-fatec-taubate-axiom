'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("certificate_assets", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      mime_type: {
        type: Sequelize.ENUM("image/png", "image/jpeg"),
        allowNull: false,
      },
      width: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      height: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      size: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      // O arquivo mora no banco, e não em disco: o certificado de um recibo antigo precisa ser
      // reproduzível anos depois, e um diretório de uploads se perde numa troca de servidor que o
      // backup do banco atravessa inteiro.
      data: {
        type: Sequelize.BLOB("medium"),
        allowNull: false,
      },
      uploaded_by: {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("certificate_assets")
  }
};
