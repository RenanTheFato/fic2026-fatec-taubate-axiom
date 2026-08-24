import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";
import { TRANSACTION_TYPES, TransactionType } from "./transaction-model.js";

export const RECEIPT_STATUSES = ["issued", "cancelled"] as const

export type ReceiptStatus = typeof RECEIPT_STATUSES[number]

export class Receipt extends Model<InferAttributes<Receipt>, InferCreationAttributes<Receipt>> {
  declare id: CreationOptional<string>
  declare transaction_id: string
  declare sequence: number
  declare number: string
  declare status: CreationOptional<ReceiptStatus>
  declare donor_name: string
  declare donor_document: CreationOptional<string | null>
  declare amount: string
  declare transaction_type: TransactionType
  declare issued_at: Date
  declare cancelled_at: CreationOptional<Date | null>
  declare previous_hash: CreationOptional<string | null>
  declare hash: string
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Receipt.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    // Posição na corrente de hashes. É o que ordena o encadeamento e o único campo que nunca
    // pode ter buraco: verificar a corrente é caminhar de sequence em sequence.
    sequence: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    // Número impresso no documento, derivado da sequence. Não reinicia a cada ano de propósito:
    // um contador anual criaria duas numerações e a corrente só admite uma.
    number: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(...RECEIPT_STATUSES),
      allowNull: false,
      defaultValue: "issued",
    },
    // O recibo guarda cópia do nome, documento, valor e tipo em vez de ler do doador na hora de
    // imprimir: documento emitido não muda porque o cadastro mudou depois, e o hash tem que
    // continuar batendo sobre exatamente o que foi assinado.
    donor_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    donor_document: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    transaction_type: {
      type: DataTypes.ENUM(...TRANSACTION_TYPES),
      allowNull: false,
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    previous_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Receipt",
    tableName: "receipts",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
