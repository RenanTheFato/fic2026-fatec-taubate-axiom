import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// Não existe `pending`: a inscrição só nasce quando a vaga é dela. No evento gratuito isso é na
// hora; no convite pago, na confirmação do pagamento, na mesma transação de banco que debita a vaga.
export const REGISTRATION_STATUSES = ["confirmed", "cancelled"] as const

export type RegistrationStatus = typeof REGISTRATION_STATUSES[number]

export class Registration extends Model<InferAttributes<Registration>, InferCreationAttributes<Registration>> {
  declare id: CreationOptional<string>
  declare event_id: string
  declare transaction_id: CreationOptional<string | null>
  declare ticket_code: string
  declare participant_name: string
  declare participant_email: string
  declare participant_phone: CreationOptional<string | null>
  declare status: CreationOptional<RegistrationStatus>
  declare checked_in_at: CreationOptional<Date | null>
  declare checked_in_by: CreationOptional<string | null>
  declare cancelled_at: CreationOptional<Date | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Registration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
    },
    ticket_code: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
    },
    participant_name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    participant_email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      validate: { isEmail: true },
    },
    participant_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...REGISTRATION_STATUSES),
      allowNull: false,
      defaultValue: "confirmed",
    },
    checked_in_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    checked_in_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Registration",
    tableName: "registrations",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
