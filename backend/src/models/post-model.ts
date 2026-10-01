import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { sequelize } from "../config/sequelize.js";

export const POST_CATEGORIES = ["educacao", "inclusao", "saude", "eventos"] as const

export const POST_STATUSES = ["draft", "published", "archived"] as const

export type PostCategory = typeof POST_CATEGORIES[number]

export type PostStatus = typeof POST_STATUSES[number]

export class Post extends Model<InferAttributes<Post>, InferCreationAttributes<Post>> {
  declare id: CreationOptional<string>
  declare title: string
  declare slug: string
  declare excerpt: string
  declare body: string
  declare category: PostCategory
  declare image_url: CreationOptional<string | null>
  declare status: CreationOptional<PostStatus>
  declare published_at: CreationOptional<Date | null>
  declare author_id: CreationOptional<string | null>
  declare readonly created_at: CreationOptional<Date>
  declare readonly updated_at: CreationOptional<Date>
}

Post.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
    },
    excerpt: {
      type: DataTypes.STRING(320),
      allowNull: false,
    },
    // Um parágrafo por bloco, separados por linha em branco. Texto corrido, e não HTML: o que a
    // equipe escreve nunca vira marcação na página de outra pessoa.
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM(...POST_CATEGORIES),
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(...POST_STATUSES),
      allowNull: false,
      defaultValue: "draft",
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  },
  {
    sequelize,
    modelName: "Post",
    tableName: "posts",
    underscored: true,
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
)
