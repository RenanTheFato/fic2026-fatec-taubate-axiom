import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";
import { TRANSACTION_STATUSES, TransactionStatus } from "./transaction-model.js";

export const AUDIT_SOURCES = ["webhook", "manual", "reconciliation", "system"] as const

export type AuditSource = typeof AUDIT_SOURCES[number]

export class TransactionAuditLog extends Model<InferAttributes<TransactionAuditLog>, InferCreationAttributes<TransactionAuditLog>> {
  declare id: CreationOptional<string>
  declare transaction_id: string
  declare previous_status: CreationOptional<TransactionStatus | null>
  declare new_status: TransactionStatus
  declare source: AuditSource
  declare performed_by: CreationOptional<string | null>
  declare reason: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
}

TransactionAuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    previous_status: {
      type: DataTypes.ENUM(...TRANSACTION_STATUSES),
      allowNull: true,
    },
    new_status: {
      type: DataTypes.ENUM(...TRANSACTION_STATUSES),
      allowNull: false,
    },
    source: {
      type: DataTypes.ENUM(...AUDIT_SOURCES),
      allowNull: false,
    },
    performed_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "TransactionAuditLog",
    tableName: "transaction_audit_logs",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
)
