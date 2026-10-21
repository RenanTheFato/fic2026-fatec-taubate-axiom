import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";
import type { UserRole } from "./user-model.js";

export const CONTACT_CHANNELS = ["contact", "ombudsman", "work", "wall_removal"] as const

export const CONTACT_STATUSES = ["open", "resolved"] as const

export type ContactChannel = typeof CONTACT_CHANNELS[number]

export type ContactStatus = typeof CONTACT_STATUSES[number]

// Os assuntos que cada formulário do site oferece. O pedido de retirada do mural não tem assunto,
// porque o canal já diz qual é o pedido.
export const CONTACT_SUBJECTS: Record<Exclude<ContactChannel, "wall_removal">, readonly string[]> = {
  contact: ["atendimento", "doacao", "voluntariado", "parceria", "documento", "outro"],
  ombudsman: ["elogio", "sugestao", "reclamacao", "denuncia"],
  work: ["clinico", "educacao", "administrativo", "comunicacao", "apoio", "outra"],
}

// Quem lê cada canal. A ouvidoria existe para a crítica não passar por quem está sendo criticado,
// e a candidatura é assunto de contratação: as duas ficam só com a administração.
export const CONTACT_CHANNELS_BY_ROLE: Record<UserRole, readonly ContactChannel[]> = {
  admin: CONTACT_CHANNELS,
  communication: ["contact", "wall_removal"],
  finance: [],
  volunteer: [],
}

export class ContactMessage extends Model<InferAttributes<ContactMessage>, InferCreationAttributes<ContactMessage>> {
  declare id: CreationOptional<string>
  declare channel: ContactChannel
  declare subject: CreationOptional<string | null>
  declare name: string
  declare email: string
  declare phone: CreationOptional<string | null>
  declare message: CreationOptional<string | null>
  declare status: CreationOptional<ContactStatus>
  declare resolved_at: CreationOptional<Date | null>
  declare resolved_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

ContactMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    channel: {
      type: DataTypes.ENUM(...CONTACT_CHANNELS),
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING(32),
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
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...CONTACT_STATUSES),
      allowNull: false,
      defaultValue: "open",
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolved_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "ContactMessage",
    tableName: "contact_messages",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
