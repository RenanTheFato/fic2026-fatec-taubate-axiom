import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const VOLUNTEER_STATUSES = ["pending", "approved", "refused"] as const

export type VolunteerStatus = typeof VOLUNTEER_STATUSES[number]

// As frentes do programa de voluntariado, as mesmas que o formulário do site oferece. O turno
// aberto pela coordenação também é de uma delas.
export const VOLUNTEER_AREAS = ["ambulatorio", "escola", "oficina", "eventos", "comunicacao", "administrativo", "outra"] as const

export type VolunteerArea = typeof VOLUNTEER_AREAS[number]

export const VOLUNTEER_PERIODS = ["manha", "tarde", "noite", "fim-de-semana"] as const

export type VolunteerPeriod = typeof VOLUNTEER_PERIODS[number]

// O cadastro de quem doa tempo, ligado à conta com que a pessoa entra no painel. Só o cadastro
// aprovado pela coordenação entra na escala.
export class Volunteer extends Model<InferAttributes<Volunteer>, InferCreationAttributes<Volunteer>> {
  declare id: CreationOptional<string>
  declare user_id: string
  declare phone: string
  declare city: CreationOptional<string | null>
  declare area: VolunteerArea
  declare availability: VolunteerPeriod[]
  declare about: string
  declare status: CreationOptional<VolunteerStatus>
  declare review_note: CreationOptional<string | null>
  declare reviewed_at: CreationOptional<Date | null>
  declare reviewed_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Volunteer.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    area: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    availability: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    about: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...VOLUNTEER_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    review_note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    reviewed_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Volunteer",
    tableName: "volunteers",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
