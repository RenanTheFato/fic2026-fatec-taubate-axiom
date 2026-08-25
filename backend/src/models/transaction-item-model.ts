import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export class TransactionItem extends Model<InferAttributes<TransactionItem>, InferCreationAttributes<TransactionItem>> {
  declare id: CreationOptional<string>
  declare transaction_id: string
  declare product_id: CreationOptional<string | null>
  declare description: string
  declare quantity: CreationOptional<number>
  declare unit_price: string
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

TransactionItem.init(
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
    product_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1 },
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "TransactionItem",
    tableName: "transaction_items",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
