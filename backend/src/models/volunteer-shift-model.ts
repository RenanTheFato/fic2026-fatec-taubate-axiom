import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";
import type { VolunteerArea } from "./volunteer-model.js";

export const SHIFT_STATUSES = ["open", "cancelled"] as const

export type ShiftStatus = typeof SHIFT_STATUSES[number]

// O turno que a coordenação abre na escala. Realizado não é um status: um turno aberto cujo fim já
// passou é um turno que aconteceu, e é a presença de cada voluntário que diz quem esteve lá.
export class VolunteerShift extends Model<InferAttributes<VolunteerShift>, InferCreationAttributes<VolunteerShift>> {
  declare id: CreationOptional<string>
  declare activity: string
  declare area: VolunteerArea
  declare place: string
  declare coordinator: string
  declare description: CreationOptional<string | null>
  declare starts_at: Date
  declare ends_at: Date
  declare slots: number
  declare taken_slots: CreationOptional<number>
  declare status: CreationOptional<ShiftStatus>
  declare created_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

VolunteerShift.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    activity: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    area: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    place: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    coordinator: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ends_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    slots: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    taken_slots: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM(...SHIFT_STATUSES),
      allowNull: false,
      defaultValue: "open",
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "VolunteerShift",
    tableName: "volunteer_shifts",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
