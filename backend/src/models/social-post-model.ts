import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

// As redes em que a associação publica, as mesmas do rodapé do site.
export const SOCIAL_NETWORKS = ["instagram", "facebook", "youtube"] as const

export type SocialNetwork = typeof SOCIAL_NETWORKS[number]

// Uma publicação da associação numa rede social, mostrada no site com a foto (ou o vídeo) e o
// texto. Chega pelo cadastro da Comunicação ou pela importação automática do Instagram.
export class SocialPost extends Model<InferAttributes<SocialPost>, InferCreationAttributes<SocialPost>> {
  declare id: CreationOptional<string>
  declare network: SocialNetwork
  declare url: string
  declare external_id: CreationOptional<string | null>
  declare caption: string
  declare image_url: CreationOptional<string | null>
  declare video_id: CreationOptional<string | null>
  declare published_at: Date
  declare visible: CreationOptional<boolean>
  declare created_by: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

SocialPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    network: {
      type: DataTypes.ENUM(...SOCIAL_NETWORKS),
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    external_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
      unique: true,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    video_id: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    visible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    modelName: "SocialPost",
    tableName: "social_posts",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
