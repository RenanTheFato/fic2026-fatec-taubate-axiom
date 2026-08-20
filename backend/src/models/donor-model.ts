import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const DOCUMENT_TYPES = ["cpf", "cnpj"] as const

export type DocumentType = typeof DOCUMENT_TYPES[number]

export class Donor extends Model<InferAttributes<Donor>, InferCreationAttributes<Donor>> {
  declare id: CreationOptional<string>
  declare user_id: CreationOptional<string | null>
  declare name: string
  declare email: string
  declare document: CreationOptional<string | null>
  declare document_type: CreationOptional<DocumentType | null>
  declare phone: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Donor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      validate: { isEmail: true },
    },
    document: {
      type: DataTypes.STRING(14),
      allowNull: true,
      unique: true,
    },
    document_type: {
      type: DataTypes.ENUM(...DOCUMENT_TYPES),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Donor",
    tableName: "donors",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
