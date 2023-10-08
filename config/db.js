const { Sequelize } = require("sequelize");

//* Instantiates sequelize with the name of database, username, password and configuration options
const createDB = new Sequelize("test-db", "user", "pass", {
    dialect: "sqlite",
    host: "./config/db.sqlite",
});


//* Connects the ExpressJS app to DB
const connectDB = () => {
    createDB.sync().then((res) => {
        console.log("Successfully connected to database");
    })
        .catch((err) => console.log("Cannot connect to database due to:", err));
};

module.exports = { createDB, connectDB };

const userModel = require("../models/userModel");
const orderModel = require("../models/orderModel");

// Association to link userModel to orderModel
orderModel.belongsTo(userModel, { foreignKey: "buyerID" });
//to say it has many to many relationship
userModel.hasMany(orderModel, { foreignKey: "id" });