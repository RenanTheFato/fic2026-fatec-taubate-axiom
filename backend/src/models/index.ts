import { sequelize } from "../config/sequelize.js";
import { User } from "./user-model.js";
import { Campaign } from "./campaign-model.js";
import { Donor } from "./donor-model.js";
import { Product } from "./product-model.js";
import { Event } from "./event-model.js";
import { Transaction } from "./transaction-model.js";
import { TransactionAuditLog } from "./transaction-audit-log-model.js";

// Identity

User.hasOne(Donor, { foreignKey: "user_id", as: "donor" })
Donor.belongsTo(User, { foreignKey: "user_id", as: "user" })

// Campaign

Campaign.hasMany(Event, { foreignKey: "campaign_id", as: "events" })
Event.belongsTo(Campaign, { foreignKey: "campaign_id", as: "campaign" })

Campaign.hasMany(Transaction, { foreignKey: "campaign_id", as: "transactions" })
Transaction.belongsTo(Campaign, { foreignKey: "campaign_id", as: "campaign" })

// Donor

Donor.hasMany(Transaction, { foreignKey: "donor_id", as: "transactions" })
Transaction.belongsTo(Donor, { foreignKey: "donor_id", as: "donor" })

// Event

Event.hasMany(Transaction, { foreignKey: "event_id", as: "transactions" })
Transaction.belongsTo(Event, { foreignKey: "event_id", as: "event" })

// Transaction audit

Transaction.hasMany(TransactionAuditLog, { foreignKey: "transaction_id", as: "audit_logs" })
TransactionAuditLog.belongsTo(Transaction, { foreignKey: "transaction_id", as: "transaction" })
TransactionAuditLog.belongsTo(User, { foreignKey: "performed_by", as: "author" })

export { sequelize, User, Campaign, Donor, Product, Event, Transaction, TransactionAuditLog }
