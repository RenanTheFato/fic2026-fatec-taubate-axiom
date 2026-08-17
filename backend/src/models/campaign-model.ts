import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const CAMPAIGN_STATUSES = ["draft", "active", "finished", "cancelled"] as const

export type CampaignStatus = typeof CAMPAIGN_STATUSES[number]

export class Campaign extends Model<InferAttributes<Campaign>, InferCreationAttributes<Campaign>> {
  declare id: CreationOptional<string>
  declare title: string
  declare slug: string
  declare description: CreationOptional<string | null>
  declare goal_amount: string
  declare raised_amount: CreationOptional<string>
  declare starts_at: Date
  declare ends_at: CreationOptional<Date | null>
  declare status: CreationOptional<CampaignStatus>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Campaign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    goal_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    raised_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...CAMPAIGN_STATUSES),
      allowNull: false,
      defaultValue: "draft",
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Campaign",
    tableName: "campaigns",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
