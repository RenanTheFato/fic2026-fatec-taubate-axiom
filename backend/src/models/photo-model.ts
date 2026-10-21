import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const PHOTO_TYPES = ["image/png", "image/jpeg"] as const

export type PhotoType = typeof PHOTO_TYPES[number]

export class Photo extends Model<InferAttributes<Photo>, InferCreationAttributes<Photo>> {
  declare id: CreationOptional<string>
  declare name: string
  declare mime_type: PhotoType
  declare width: number
  declare height: number
  declare size: number
  declare data: Buffer
  declare uploaded_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Photo.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    mime_type: {
      type: DataTypes.ENUM(...PHOTO_TYPES),
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    height: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    data: {
      type: DataTypes.BLOB("medium"),
      allowNull: false,
    },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Photo",
    tableName: "photos",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
