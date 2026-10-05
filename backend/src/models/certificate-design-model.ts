import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";
import type { CertificateDesignSpec } from "../utils/certificate-design.js";

export const CERTIFICATE_SCOPES = ["default", "campaign", "event"] as const

export type CertificateScope = typeof CERTIFICATE_SCOPES[number]

// Uma versão de certificado. Imutável depois de gravada: personalizar de novo é criar a versão
// seguinte na mesma pasta, e o recibo guarda o id da versão com que nasceu.
export class CertificateDesign extends Model<InferAttributes<CertificateDesign>, InferCreationAttributes<CertificateDesign>> {
  declare id: CreationOptional<string>
  declare scope: CertificateScope
  declare campaign_id: CreationOptional<string | null>
  declare event_id: CreationOptional<string | null>
  declare folder: string
  declare version: number
  declare label: string
  declare design: CertificateDesignSpec
  declare created_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

CertificateDesign.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    scope: {
      type: DataTypes.ENUM(...CERTIFICATE_SCOPES),
      allowNull: false,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    folder: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    version: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    design: {
      type: DataTypes.JSON,
      allowNull: false,
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
    modelName: "CertificateDesign",
    tableName: "certificate_designs",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)

// A chave da pasta, numa função só: o serviço que grava, o que lista e o que resolve a versão na
// emissão do recibo precisam escrever exatamente a mesma string.
export function folderKey(scope: CertificateScope, targetId: string | null) {
  return scope === "default" ? "default" : `${scope}:${targetId}`
}
