'use strict';

// A foto de campanha e de evento passa a morar no banco. Antes, o frontend resolvia a imagem do
// evento pelo slug numa tabela própria, e campanha nem tinha foto: o conteúdo ficava dividido entre
// dois pacotes, e trocar uma foto exigia publicar o site.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("campaigns", "image_url", {
      type: Sequelize.STRING(512),
      allowNull: true,
    })

    await queryInterface.addColumn("events", "image_url", {
      type: Sequelize.STRING(512),
      allowNull: true,
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("events", "image_url")
    await queryInterface.removeColumn("campaigns", "image_url")
  }
};
