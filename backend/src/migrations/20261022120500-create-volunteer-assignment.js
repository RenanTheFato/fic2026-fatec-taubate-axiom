'use strict';

const ASSIGNMENT_STATUSES = ['pending', 'confirmed', 'attended', 'absent', 'cancelled']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // O voluntário num turno. A presença é fechada pela coordenação, e só ela soma horas.
    await queryInterface.createTable("volunteer_assignments", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      shift_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "volunteer_shifts", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      volunteer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "volunteers", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM(...ASSIGNMENT_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      // Horas validadas pela coordenação. Só existe na presença registrada.
      hours: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      checked_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      checked_by: {
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

    // Uma pessoa entra no mesmo turno uma vez só. Quem sai e volta reaproveita a linha.
    await queryInterface.addIndex("volunteer_assignments", ["shift_id", "volunteer_id"], { unique: true })
    await queryInterface.addIndex("volunteer_assignments", ["volunteer_id", "status"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("volunteer_assignments")
  }
};
