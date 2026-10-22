'use strict';

const SOCIAL_NETWORKS = ['instagram', 'facebook', 'youtube']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // O que a associação publicou nas redes, trazido para dentro do site.
    await queryInterface.createTable("social_posts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      network: {
        type: Sequelize.ENUM(...SOCIAL_NETWORKS),
        allowNull: false,
      },
      // O endereço da publicação na rede, para quem quiser comentar ou compartilhar por lá.
      url: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      // O id da mídia na rede, quando a publicação veio pela importação automática. É o que impede
      // a mesma publicação de entrar duas vezes.
      external_id: {
        type: Sequelize.STRING(64),
        allowNull: true,
        unique: true,
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      // O vídeo do YouTube, tirado do endereço. O site toca o vídeo sem sair da página.
      video_id: {
        type: Sequelize.STRING(32),
        allowNull: true,
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      visible: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex("social_posts", ["visible", "published_at"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("social_posts")
  }
};
