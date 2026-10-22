'use strict';

const VOLUNTEER_STATUSES = ['pending', 'approved', 'refused']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("volunteers", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(80),
        allowNull: true,
      },
      area: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      // Os períodos marcados no cadastro: manhã, tarde, noite e fim de semana.
      availability: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      about: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(...VOLUNTEER_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      review_note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reviewed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      reviewed_by: {
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

    await queryInterface.addIndex("volunteers", ["status", "created_at"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("volunteers")
  }
};
