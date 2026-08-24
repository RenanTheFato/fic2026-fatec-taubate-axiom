import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const TRANSACTION_TYPES = ["donation", "sponsorship", "ticket", "product"] as const

export const TRANSACTION_STATUSES = ["pending", "awaiting_confirmation", "confirmed", "refused", "cancelled", "refunded"] as const

export const PAYMENT_METHODS = ["pix", "credit_card", "debit_card", "boleto", "manual_pix"] as const

export type TransactionType = typeof TRANSACTION_TYPES[number]

export type TransactionStatus = typeof TRANSACTION_STATUSES[number]

export type PaymentMethod = typeof PAYMENT_METHODS[number]

export class Transaction extends Model<InferAttributes<Transaction>, InferCreationAttributes<Transaction>> {
  declare id: CreationOptional<string>
  declare type: TransactionType
  declare status: CreationOptional<TransactionStatus>
  declare amount: string
  declare payment_method: CreationOptional<PaymentMethod | null>
  declare donor_id: string
  declare campaign_id: CreationOptional<string | null>
  declare event_id: CreationOptional<string | null>
  declare gateway_checkout_id: CreationOptional<string | null>
  declare gateway_payment_id: CreationOptional<string | null>
  declare checkout_url: CreationOptional<string | null>
  declare notes: CreationOptional<string | null>
  declare confirmed_at: CreationOptional<Date | null>
  declare refunded_at: CreationOptional<Date | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(...TRANSACTION_TYPES),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...TRANSACTION_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    payment_method: {
      type: DataTypes.ENUM(...PAYMENT_METHODS),
      allowNull: true,
    },
    donor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    gateway_checkout_id: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    gateway_payment_id: {
      type: DataTypes.STRING(128),
      allowNull: true,
      unique: true,
    },
    checkout_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    confirmed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refunded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Transaction",
    tableName: "transactions",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
