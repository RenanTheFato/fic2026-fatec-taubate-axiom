import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// O que um parceiro aprovado pode sugerir à associação: uma campanha, um aporte em dinheiro, o
// patrocínio de um evento, a doação de produtos ou serviços e um dia de voluntariado da equipe.
export const PROPOSAL_KINDS = ["campaign", "contribution", "sponsorship", "in_kind", "volunteering"] as const

export type ProposalKind = typeof PROPOSAL_KINDS[number]

export const PROPOSAL_STATUSES = ["pending", "accepted", "refused", "withdrawn"] as const

export type ProposalStatus = typeof PROPOSAL_STATUSES[number]

// As propostas que viram dinheiro. Depois de aceitas, o parceiro paga pelo mesmo checkout de
// qualquer doação, e o valor só entra na campanha quando o webhook confirma.
export const PAYABLE_KINDS: readonly ProposalKind[] = ["contribution", "sponsorship"]

export class PartnerProposal extends Model<InferAttributes<PartnerProposal>, InferCreationAttributes<PartnerProposal>> {
  declare id: CreationOptional<string>
  declare partner_id: string
  declare kind: ProposalKind
  declare title: string
  declare description: string
  declare amount: CreationOptional<string | null>
  declare campaign_id: CreationOptional<string | null>
  declare event_id: CreationOptional<string | null>
  declare status: CreationOptional<ProposalStatus>
  declare response_note: CreationOptional<string | null>
  declare reviewed_at: CreationOptional<Date | null>
  declare reviewed_by: CreationOptional<string | null>
  declare transaction_id: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

PartnerProposal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    partner_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    kind: {
      type: DataTypes.ENUM(...PROPOSAL_KINDS),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...PROPOSAL_STATUSES),
      allowNull: false,
      defaultValue: "pending",
    },
    response_note: {
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
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "PartnerProposal",
    tableName: "partner_proposals",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
