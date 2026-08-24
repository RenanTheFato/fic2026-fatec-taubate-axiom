'use strict';

const TRANSACTION_TYPES = ['donation', 'sponsorship', 'ticket', 'product']

const TRANSACTION_STATUSES = ['pending', 'awaiting_confirmation', 'confirmed', 'refused', 'cancelled', 'refunded']

const PAYMENT_METHODS = ['pix', 'credit_card', 'debit_card', 'boleto', 'manual_pix']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("transactions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: Sequelize.ENUM(...TRANSACTION_TYPES),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM(...TRANSACTION_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      payment_method: {
        type: Sequelize.ENUM(...PAYMENT_METHODS),
        allowNull: true,
      },
      donor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "donors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "campaigns",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "events",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      gateway_checkout_id: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      gateway_payment_id: {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: true,
      },
      checkout_url: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      confirmed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      refunded_at: {
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

    // Painel financeiro: filtra por status e ordena por data na mesma varredura.
    await queryInterface.addIndex("transactions", ["status", "created_at"], { name: "transactions_status_created_at_idx" })
    // Soma da arrecadação por campanha.
    await queryInterface.addIndex("transactions", ["campaign_id", "status"], { name: "transactions_campaign_id_status_idx" })
    // Histórico do doador e ocupação de vaga por evento.
    await queryInterface.addIndex("transactions", ["donor_id"], { name: "transactions_donor_id_idx" })
    await queryInterface.addIndex("transactions", ["event_id", "status"], { name: "transactions_event_id_status_idx" })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("transactions")
  }
};
