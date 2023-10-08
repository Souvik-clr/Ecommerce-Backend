const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const SECRET = "This is our secret";
const {
    validateName,
    validateEmail,
    validatePassword,
} = require("../utils/validators.js");

// router.get("/",(req,res)=>{
//     res.send("okk")
// })
router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, isSeller } = req.body; //* destructuring name, email and password out of the request body
        const existingUser = await User.findOne({ where: { email: email } }); //* check if the user with the entered email already exists in the database
        if (existingUser) {
            return res.status(403).json({ err: "User already exists" });
        }

        if (!validateName(name)) {
            return res.status(400).json({
                err: "Invalid user name: name must be longer than two characters and must not include any numbers or special characters",
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ err: "Error: Invalid email" });
        }

        if (!validatePassword(password)) {
            return res.status(400).json({
                err: "Error: Invalid password: password must be at least 8 characters long and must include atleast one - one uppercase letter, one lowercase letter, one digit, one special character",
            });
        }
        //* hashes the password with a salt, generated with the specified number of rounds
        const hashedpassword = await bcrypt.hash(password, (saltOrRounds = 10));
        const user = {
            email,
            name,
            password: hashedpassword,
            isSeller: isSeller || false,   //, this line of code ensures that isSeller will have a value of true if it was originally truthy, or false if it was originally falsy or undefined. It effectively provides a default value of false if isSeller is not already set.
        };
        // console.log(user);
        const createdUser = await User.create(user);
        // console.log(createdUser);
        return res.status(201).json({
            message: `Welcome to ECOM ${createdUser.name}. Thank you for signing up`,
        });
    } catch (e) {
        return res.status(500).send(e);
    }
})


router.post("/signin", async (req, res) => {
    try {
        const { email, password } = req.body; //* destructuring email and password out of the request body

        if (email.length === 0) {
            return res.status(400).json({ err: "Please enter your email" });
        }
        if (password.length === 0) {
            return res.status(400).json({ err: "Please enter your password" });
        }

        const existingUser = await User.findOne({ where: { email: email } }); //* check if the user with the entered email exists in the database
        if (!existingUser) {
            return res.status(404).json("Error: User not found");
        }

        //* hashes the entered password and then compares it to the hashed password stored in the database
        const passwordMatched = await bcrypt.compare(
            password,
            existingUser.password
        );
        if (!passwordMatched) {
            return res.status(400).send("Error: Incorrect password or Email");
        }
        //Encryption
        const payload = { user: { id: existingUser.id } };
        //create the jwt token
        const bearerToken = await jwt.sign(payload, SECRET, {
            expiresIn: 360000,
        });
        //send in cookies t -> key,value -> bearerToken & expiretime
        //bearerToken can be converted into the payload object using the secret message(if you have the secret message you can convert whatever the string bearerToken generates back into the payload object )
        res.cookie("t", bearerToken, { expire: new Date() + 9999 });

        console.log("Logged in successfully");

        return res
            .status(200)
            .json({ message: "Signed In Successfully!", bearerToken: bearerToken });
    } catch (err) {
        // console.log(err);
        return res.status(500).json({ err: err.message });
    }
});


router.get("/signout", async (_req, res) => {
    try {
      res.clearCookie("t");
      return res.status(200).json({ message: "Signed out successfully" });
    } catch (err) {
    //   console.log(err.message);
      return res.status(500).json({ err: err.message });
    }
  });












module.exports = router;