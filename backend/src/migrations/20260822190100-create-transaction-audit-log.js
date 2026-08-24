'use strict';

const TRANSACTION_STATUSES = ['pending', 'awaiting_confirmation', 'confirmed', 'refused', 'cancelled', 'refunded']

const AUDIT_SOURCES = ['webhook', 'manual', 'reconciliation', 'system']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Log de auditoria é imutável: a tabela nasce sem updated_at de propósito.
    await queryInterface.createTable("transaction_audit_logs", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "transactions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      previous_status: {
        type: Sequelize.ENUM(...TRANSACTION_STATUSES),
        allowNull: true,
      },
      new_status: {
        type: Sequelize.ENUM(...TRANSACTION_STATUSES),
        allowNull: false,
      },
      source: {
        type: Sequelize.ENUM(...AUDIT_SOURCES),
        allowNull: false,
      },
      performed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    })

    await queryInterface.addIndex("transaction_audit_logs", ["transaction_id", "created_at"], { name: "transaction_audit_logs_transaction_id_created_at_idx" })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transaction_audit_logs")
  }
};
