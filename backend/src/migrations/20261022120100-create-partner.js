'use strict';

const PARTNER_STATUSES = ['pending', 'approved', 'refused']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("partners", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      // A conta com que a empresa entra no painel. Nula nos parceiros que já estavam na rede antes
      // da plataforma: eles aparecem no site, mas nunca pediram acesso.
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      company_name: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      // CNPJ só com dígitos, como o documento do doador. Nulo pelo mesmo motivo do user_id.
      document: {
        type: Sequelize.STRING(14),
        allowNull: true,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      logo_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      // As formas de apoio que a empresa marcou no pedido.
      interests: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      // A marca só entra na rede pública do site com autorização da empresa.
      public_listing: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: Sequelize.ENUM(...PARTNER_STATUSES),
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

    // O painel lê os pedidos por situação, do mais novo para o mais antigo.
    await queryInterface.addIndex("partners", ["status", "created_at"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("partners")
  }
};
