'use strict';

const DOCUMENT_TYPES = ['cpf', 'cnpj']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("donors", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      document: {
        type: Sequelize.STRING(14),
        allowNull: true,
        unique: true,
      },
      document_type: {
        type: Sequelize.ENUM(...DOCUMENT_TYPES),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
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

    await queryInterface.addIndex("donors", ["email"], { name: "donors_email_idx" })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("donors")
  }
};
