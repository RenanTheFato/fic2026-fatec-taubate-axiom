'use strict';

const REGISTRATION_STATUSES = ['confirmed', 'cancelled']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("registrations", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      // Evento com inscrito não se apaga: a lista de presença é o registro de quem esteve lá.
      event_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "events", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      // Nulo no evento gratuito. No convite pago é a transação que pagou a vaga, uma para uma.
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
        references: { model: "transactions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      ticket_code: {
        type: Sequelize.STRING(16),
        allowNull: false,
        unique: true,
      },
      participant_name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      participant_email: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      participant_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(...REGISTRATION_STATUSES),
        allowNull: false,
        defaultValue: "confirmed",
      },
      checked_in_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      checked_in_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      cancelled_at: {
        type: Sequelize.DATE,
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

    // A lista de presença lê os inscritos de um evento por situação.
    await queryInterface.addIndex("registrations", ["event_id", "status"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("registrations")
  }
};
