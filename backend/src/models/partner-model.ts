import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const PARTNER_STATUSES = ["pending", "approved", "refused"] as const

export type PartnerStatus = typeof PARTNER_STATUSES[number]

// As formas de apoio que a página de parceiros apresenta, e que a empresa marca no pedido.
export const PARTNER_INTERESTS = ["sponsorship", "contribution", "in_kind", "volunteering", "institutional"] as const

export type PartnerInterest = typeof PARTNER_INTERESTS[number]

// A empresa da rede de parceiros. Nasce do pedido feito pelo site, com a conta que ela usa para
// entrar no painel, e só alcança o painel completo depois que a associação aprova.
export class Partner extends Model<InferAttributes<Partner>, InferCreationAttributes<Partner>> {
  declare id: CreationOptional<string>
  declare user_id: CreationOptional<string | null>
  declare company_name: string
  declare document: CreationOptional<string | null>
  declare phone: CreationOptional<string | null>
  declare website: CreationOptional<string | null>
  declare logo_url: CreationOptional<string | null>
  declare interests: PartnerInterest[]
  declare message: CreationOptional<string | null>
  declare public_listing: CreationOptional<boolean>
  declare status: CreationOptional<PartnerStatus>
  declare review_note: CreationOptional<string | null>
  declare reviewed_at: CreationOptional<Date | null>
  declare reviewed_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Partner.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      unique: true,
    },
    company_name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    document: {
      type: DataTypes.STRING(14),
      allowNull: true,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    logo_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    interests: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    public_listing: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM(...PARTNER_STATUSES),
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
    modelName: "Partner",
    tableName: "partners",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
