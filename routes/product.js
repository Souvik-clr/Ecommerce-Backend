const express = require("express");
const router = express.Router();
const upload = require("../utils/fileUpload");
const Product = require("../models/productModel");
const { isAuthenticated, isSeller, isBuyer } = require("../middleware/auth");
const stripe = require("stripe")(
    "PUT_STRIPE_ID"
  ); 

// this is a class as (WebhookClient) first letter is capital
const { WebhookClient } = require("discord.js");
//creating a object
const webhookClient = new WebhookClient({
    url: "enter your discord webhook url here",
  });


//before calling the fn we need to check user is authenticated or not and the user is seller or not
router.post("/create", isAuthenticated, isSeller, (req, res) => {
    // console.log("okkk");  
    upload(req, res, async (err) => {
        if (err) {
            console.log('coming in err', err);
            return res.status(500).send(err);
        }

        const { name, price } = req.body;
        if (!name || !price || !req.file) {
            return res
                .status(400)
                .json({ err: "All fields should be selected - name, price, file" });
        }

        if (Number.isNaN(price)) {
            return res.status(400).json({ err: "Price must be a number" });
        }
        let productDetails = {
            name,
            price,
            content: req.file.path
        };
        //to store productdetais inside produt table
        const createdProduct = await Product.create(productDetails);

        console.log("Created Product", createdProduct);

        return res.status(201).json({ message: "Product created" });
    })
})

//to show all the products
router.get("/get/all", isAuthenticated, async (_req, res) => {
    try {
        const products = await Product.findAll();
        return res.status(200).json({ Products: products });
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ err: err.message });
    }
});


router.post("/buy/:productID", isAuthenticated, isBuyer, async (req, res) => {
    try {
        //checking the product exist or not using productID
        const product = await Product.findOne({
            where: { id: req.params.productID },
        });
        //if not exist
        if (!product) {
            return res.status(404).json({ err: "Product not found" });
        }
        //create the orderdetails 
        const orderDetails = {
            productID: product.dataValues.id,
            productName: product.dataValues.name,
            productPrice: product.dataValues.price,
            buyerID: req.user.dataValues.id,
            buyerEmail: req.user.dataValues.email,
        };

        let paymentMethod = await stripe.paymentMethods.create({
            type: "card",
            card: {
                number: "4242424242424242",
                exp_month: 9,
                exp_year: 2023,
                cvc: "314",
            },
        });

        let paymentIntent = await stripe.paymentIntents.create({
            amount: product.dataValues.price * 100,
            currency: "inr",
            payment_method_types: ["card"],
            payment_method: paymentMethod.id,
            confirm: true,
        });


        if (paymentIntent) {
            //put in database
            const createdOrder = await Order.create(orderDetails);

            // send a discord message after order is created
            webhookClient.send({
                content: `Order Details\nOrderID:${createdOrder.id}\nProduct ID: ${createdOrder.productID}\nProduct Name: ${createdOrder.productName}\nProduct Price: ${createdOrder.productPrice}\nBuyer Name:${req.user.name}\nBuyer Email: ${createdOrder.buyerEmail}`,
                username: "order-keeper",
                avatarURL: "https://i.imgur.com/AfFp7pu.png",
            });

            return res.status(201).json({ message: "Order created", createdOrder });
        } else {
            return res.status(400).json({ err: "Something went wrong" });
        }

        //      *****for stripe payment page redirection******
        // const session = await stripe.checkout.sessions.create({
        //     payment_method_types: ["card"],
        //     mode: "payment",
        //     line_items: [{
        //         price_data: {
        //             currency: "inr",
        //             product_data:{
        //                 name:product.dataValues.name,
        //             },
        //             unit_amount:product.dataValues.price *100,
        //         },
        //         quantity : 1,
        //     }],
        //     success_url:'http://localhost:3000/success.html',
        //     cancel_url: 'http://localhost:3000/cancel.html'
        // })
        // return res.send({id:session.url});
    } catch (err) {
        console.log(err.message);
        return res.status(500).json({ err: err.message });
    }
});


module.exports = router;