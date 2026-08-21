import { sequelize } from "../config/sequelize.js";
import { User } from "./user-model.js";
import { Campaign } from "./campaign-model.js";
import { Donor } from "./donor-model.js";
import { Product } from "./product-model.js";

// Identity

User.hasOne(Donor, { foreignKey: "user_id", as: "donor" })
Donor.belongsTo(User, { foreignKey: "user_id", as: "user" })

export { sequelize, User, Campaign, Donor, Product }
