'use strict';

const SHIFT_STATUSES = ['open', 'cancelled']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // O turno que a coordenação abre: uma atividade, num lugar, num horário, com um número de vagas.
    await queryInterface.createTable("volunteer_shifts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      activity: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      area: {
        type: Sequelize.STRING(32),
        allowNull: false,
      },
      place: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      coordinator: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      starts_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      slots: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },
      // Vagas ocupadas, como `taken_seats` do evento: decididas por UPDATE condicional.
      taken_slots: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM(...SHIFT_STATUSES),
        allowNull: false,
        defaultValue: "open",
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

    await queryInterface.addIndex("volunteer_shifts", ["starts_at"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("volunteer_shifts")
  }
};
