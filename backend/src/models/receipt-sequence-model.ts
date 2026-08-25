import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const RECEIPT_SEQUENCE_ID = 1

export class ReceiptSequence extends Model<InferAttributes<ReceiptSequence>, InferCreationAttributes<ReceiptSequence>> {
  declare id: CreationOptional<number>
  declare last_sequence: CreationOptional<number>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

ReceiptSequence.init(
  {
    id: {
      type: DataTypes.TINYINT.UNSIGNED,
      primaryKey: true,
    },
    last_sequence: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "ReceiptSequence",
    tableName: "receipt_sequences",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
