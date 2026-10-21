'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("photos", {
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
      // Mesma decisão da biblioteca de certificados: a foto mora no banco, e não num diretório de
      // uploads que se perde na troca de servidor. O backup do banco leva as fotos junto.
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
    await queryInterface.dropTable("photos")
  }
};
