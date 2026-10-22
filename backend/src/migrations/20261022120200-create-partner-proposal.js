'use strict';

const PROPOSAL_KINDS = ['campaign', 'contribution', 'sponsorship', 'in_kind', 'volunteering']
const PROPOSAL_STATUSES = ['pending', 'accepted', 'refused', 'withdrawn']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("partner_proposals", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      partner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "partners", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      kind: {
        type: Sequelize.ENUM(...PROPOSAL_KINDS),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      // Obrigatório no aporte e no patrocínio, que viram pagamento; estimativa opcional nos outros.
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      campaign_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      event_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "events", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.ENUM(...PROPOSAL_STATUSES),
        allowNull: false,
        defaultValue: "pending",
      },
      response_note: {
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
      // O pagamento do aporte aceito. É a mesma transação de qualquer doação: passa pelo checkout,
      // é confirmada pelo webhook e gera recibo na corrente.
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: "transactions", key: "id" },
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

    await queryInterface.addIndex("partner_proposals", ["status", "created_at"])
    await queryInterface.addIndex("partner_proposals", ["partner_id", "created_at"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("partner_proposals")
  }
};
