'use strict';

const POST_CATEGORIES = ['educacao', 'inclusao', 'saude', 'eventos']
const POST_STATUSES = ['draft', 'published', 'archived']

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("posts", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(160),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(180),
        allowNull: false,
        unique: true,
      },
      excerpt: {
        type: Sequelize.STRING(320),
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM(...POST_CATEGORIES),
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING(512),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(...POST_STATUSES),
        allowNull: false,
        defaultValue: "draft",
      },
      published_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      author_id: {
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

    await queryInterface.addIndex("posts", ["status", "published_at"])
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("posts")
  }
};
