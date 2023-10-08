const jwt = require("jsonwebtoken");
const SECRET = "This is our secret";
const User = require("../models/userModel");
// const { Database } = require("sqlite3");

const isAuthenticated = async (req, res,next) =>{
    try{
    const authHeader = req.headers.authorization;//Bearer {TOKEN}
    console.log(authHeader);
    // if token does not exist 
    if (!authHeader) {
      return res.status(401).json({
        err: "You must be logged in",
      });
    }
    
    const token = authHeader.split(" ")[1]; // This is the bearer token(split into two part using space )after spliting: ["bearer", "TOKEN"]
    // const token = authHeader;
    console.log(token);
    if (!token) {
      return res.status(401).json({
        err: "No token, authorization denied",
      });
    }
    //decoding the token using secret msg
    const decoded = jwt.verify(token, SECRET);
    // grt the user from Database
    const user = await User.findOne({ where: { id: decoded.user.id } });
    // if user not found 
    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }
    req.user = user; //to reduce the data base call in the next funtion.In the next funtion req.user will be same output from this function
    next();
    } catch(error){
        return res.status(500).send(error);
    }
}

const isSeller = (req, res, next) => {
  if (req.user.dataValues.isSeller) {
    next();
  } else {
    res.status(401).json({
      err: "You are not a seller",
    });
  }
};


const isBuyer = (req, res, next) => {
  if (!req.user.dataValues.isSeller) {
    next();
  } else {
    res.status(401).json({
      err: "You are not a buyer",
    });
  }
};

module.exports = { isAuthenticated, isSeller, isBuyer};