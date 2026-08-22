import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const EVENT_STATUSES = ["draft", "published", "finished", "cancelled"] as const

export type EventStatus = typeof EVENT_STATUSES[number]

export class Event extends Model<InferAttributes<Event>, InferCreationAttributes<Event>> {
  declare id: CreationOptional<string>
  declare campaign_id: CreationOptional<string | null>
  declare title: string
  declare slug: string
  declare description: CreationOptional<string | null>
  declare location: CreationOptional<string | null>
  declare starts_at: Date
  declare ends_at: CreationOptional<Date | null>
  declare ticket_price: CreationOptional<string>
  declare capacity: CreationOptional<number | null>
  declare taken_seats: CreationOptional<number>
  declare status: CreationOptional<EventStatus>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
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
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ticket_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    capacity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    taken_seats: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...EVENT_STATUSES),
      allowNull: false,
      defaultValue: "draft",
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "events",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)