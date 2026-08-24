'use strict';

const RECEIPT_STATUSES = ['issued', 'cancelled']

const TRANSACTION_TYPES = ['donation', 'sponsorship', 'ticket', 'product']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("receipts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "transactions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      sequence: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
      },
      number: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM(...RECEIPT_STATUSES),
        allowNull: false,
        defaultValue: "issued",
      },
      donor_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      donor_document: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      transaction_type: {
        type: Sequelize.ENUM(...TRANSACTION_TYPES),
        allowNull: false,
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      previous_hash: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
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

    await queryInterface.addIndex("receipts", ["status", "issued_at"], { name: "receipts_status_issued_at_idx" })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("receipts")
  }
};
