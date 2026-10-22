import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// pending: a pessoa se ofereceu e a vaga ficou reservada; confirmed: a coordenação contou com ela;
// attended e absent: a presença fechada depois do turno; cancelled: saiu antes, e a vaga voltou.
export const ASSIGNMENT_STATUSES = ["pending", "confirmed", "attended", "absent", "cancelled"] as const

export type AssignmentStatus = typeof ASSIGNMENT_STATUSES[number]

// Os estados que seguram uma vaga do turno.
export const HOLDING_STATUSES: readonly AssignmentStatus[] = ["pending", "confirmed", "attended", "absent"]

export class VolunteerAssignment extends Model<InferAttributes<VolunteerAssignment>, InferCreationAttributes<VolunteerAssignment>> {
  declare id: CreationOptional<string>
  declare shift_id: string
  declare volunteer_id: string
  declare status: CreationOptional<AssignmentStatus>
  declare hours: CreationOptional<string | null>
  declare checked_at: CreationOptional<Date | null>
  declare checked_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

VolunteerAssignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    shift_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    volunteer_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...ASSIGNMENT_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    checked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checked_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "VolunteerAssignment",
    tableName: "volunteer_assignments",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
