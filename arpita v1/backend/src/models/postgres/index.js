import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
}, { timestamps: true });

export const Trip = sequelize.define('Trip', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  budget: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { timestamps: true });

export const ItineraryItem = sequelize.define('ItineraryItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  day: { type: DataTypes.INTEGER, allowNull: false },
  startTime: { type: DataTypes.STRING },
  endTime: { type: DataTypes.STRING },
  activity: { type: DataTypes.STRING, allowNull: false },
  placeId: { type: DataTypes.STRING },
  cost: { type: DataTypes.FLOAT, defaultValue: 0 },
}, { timestamps: true });

export const BudgetItem = sequelize.define('BudgetItem', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  category: { type: DataTypes.ENUM('Food', 'Hotel', 'Transport', 'Activity', 'Shopping', 'Other'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  description: { type: DataTypes.STRING },
}, { timestamps: true });

Trip.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Trip, { as: 'trips', foreignKey: 'ownerId' });
Trip.hasMany(ItineraryItem, { as: 'itinerary', onDelete: 'CASCADE' });
ItineraryItem.belongsTo(Trip);
Trip.hasMany(BudgetItem, { as: 'expenses', onDelete: 'CASCADE' });
BudgetItem.belongsTo(Trip);

export const TripMember = sequelize.define('TripMember', {
  role: { type: DataTypes.ENUM('Admin', 'Member'), defaultValue: 'Member' }
});

Trip.belongsToMany(User, { through: TripMember, as: 'members' });
User.belongsToMany(Trip, { through: TripMember, as: 'sharedTrips' });
