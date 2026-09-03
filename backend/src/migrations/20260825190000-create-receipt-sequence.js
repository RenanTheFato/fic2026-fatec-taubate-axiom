'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Uma tabela de uma linha só, que existe para ser travada. A corrente de recibos é
  // inerentemente serial, cada elo carrega o hash do anterior, e travar a última linha de
  // "receipts" com ORDER BY ... FOR UPDATE trava também o intervalo aberto depois dela, que é
  // exatamente onde toda emissão precisa inserir. O resultado eram deadlocks sob confirmações
  // simultâneas. Travando sempre a mesma linha por chave primária, as emissões formam fila.
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("receipt_sequences", {
      id: {
        type: Sequelize.TINYINT.UNSIGNED,
        primaryKey: true,
      },
      last_sequence: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    })

    // A linha nasce junto com a tabela, o service trava, nunca cria. Se ela pudesse ser criada
    // sob demanda, duas emissões simultâneas a criariam ao mesmo tempo e o problema voltaria.
    // O last_sequence parte do maior sequence já emitido, para o caso de a tabela de recibos
    // já ter conteúdo quando esta migration rodar.
    await queryInterface.sequelize.query(
      "INSERT INTO receipt_sequences (id, last_sequence) SELECT 1, COALESCE(MAX(sequence), 0) FROM receipts"
    )
  },

  async down(queryInterface) {
    await queryInterface.dropTable("receipt_sequences")
  },
}
