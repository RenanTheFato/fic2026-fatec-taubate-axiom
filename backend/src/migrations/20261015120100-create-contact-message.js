'use strict';

const CONTACT_CHANNELS = ['contact', 'ombudsman', 'work', 'wall_removal']
const CONTACT_STATUSES = ['open', 'resolved']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("contact_messages", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      channel: {
        type: Sequelize.ENUM(...CONTACT_CHANNELS),
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      // Opcional só no pedido de retirada do Mural do Bem: ali o pedido em si já é a mensagem.
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(...CONTACT_STATUSES),
        allowNull: false,
        defaultValue: "open",
      },
      resolved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      resolved_by: {
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

    // A caixa de entrada lê por situação, da mais nova para a mais antiga.
    await queryInterface.addIndex("contact_messages", ["status", "created_at"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("contact_messages")
  }
};
