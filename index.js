const express = require('express');
const colors = require('colors')
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const SSLCommerzPayment = require('sslcommerz-lts');
const bodyParser = require('body-parser');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')('sk_test_51L3TaVKQApjCPl5WRCX6QLcQrUaBT9rpcWVoDHkjMHkEMqM40YJOyXRekCkaUOCdHCmNLbpM9RYHln67ZE5DL07t00CdxpvVWv');


const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

const port = process.env.PORT || 5000;


// const uri = `mongodb+srv://emotionproducts:GAPrPCodgQ2leCGk@cluster0.hbiyhe6.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ysij9py.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


const run = async () => {
    try {

        client.connect();
        console.log(`DB Connect Successfull`.white.bgMagenta);
        const orderCollection = client.db("EProducts").collection("orders");
        // perform actions on the collection object

        // Initialize app
        app.get('/', async (req, res) => {
            try {

                /** 
                * Root url response 
                */

                return res.status(200).json({
                    message: "Welcome to Emotion Products Server",
                    url: `${process.env.ROOT}/init`
                })
            } catch (error) {
                console.log(error);
            }
        })

        // // Initialize payment
        // app.post('/init', async (req, res) => {
        //     try {
        //         // console.log("Hitting");
        //         const productInfo = {
        //             total_amount: req.body.total_amount,
        //             currency: 'USD',
        //             tran_id: uuidv4(),
        //             success_url: `${process.env.ROOT}/ssl-payment-success`,
        //             fail_url: `${process.env.ROOT}/ssl-payment-fail`,
        //             cancel_url: `${process.env.ROOT}/ssl-payment-cancel`,
        //             paymentStatus: 'pending',
        //             shipping_method: 'Courier',
        //             product_name: req.body.item_name,
        //             product_category: req.body.item_category,
        //             product_profile: req.body.item_desc,
        //             product_image: req.body.item_image,
        //             cus_name: req.body.cus_name,
        //             cus_email: req.body.cus_email,
        //             cus_add1: 'Dhaka',
        //             cus_add2: 'Dhaka',
        //             cus_city: 'Dhaka',
        //             cus_state: 'Dhaka',
        //             cus_postcode: '1000',
        //             cus_country: 'Bangladesh',
        //             cus_phone: '01711111111',
        //             cus_fax: '01711111111',
        //             ship_name: req.body.cus_name,
        //             ship_add1: 'Dhaka',
        //             ship_add2: 'Dhaka',
        //             ship_city: 'Dhaka',
        //             ship_state: 'Dhaka',
        //             ship_postcode: 1000,
        //             ship_country: 'Bangladesh',
        //             multi_card_name: 'mastercard',
        //             value_a: 'ref001_A',
        //             value_b: 'ref002_B',
        //             value_c: 'ref003_C',
        //             value_d: 'ref004_D',
        //             ipn_url: `${process.env.ROOT}/ssl-payment-notification`,
        //         };

        //         // Insert order info
        //         const result = await orderCollection.insertOne(productInfo);

        //         const sslcommerz = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASS, false) //true for live default false for sandbox
        //         sslcommerz.init(productInfo)
        //             .then(data => {
        //                 //process the response that got from sslcommerz 
        //                 //https://developer.sslcommerz.com/doc/v4/#returned-parameters
        //                 const info = { ...productInfo, ...data };
        //                 // console.log(data?.GatewayPageURL);  

        //                 if (data?.GatewayPageURL) {
        //                     // console.log('Redirecting to: ', data?.GatewayPageURL);

        //                     return res.status(200).send(data?.GatewayPageURL);

        //                     // res.send({data?.GatewayPageURL})
        //                 }
        //                 else {
        //                     return res.status(400).json({
        //                         message: "Session was not Successful"
        //                     });
        //                 }

        //             });
        //     } catch (error) {
        //         console.log(error);
        //     }

        // });

        // This is a public sample test API key.
        // Don’t submit any personally identifiable information in requests made with this key.
        // Sign in to see your own test API key embedded in code samples.



        app.post('/create-checkout-session', async (req, res) => {
            const { price } = req.body;
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: "Carport"
                            },
                            unit_amount: 3700,
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL}/checkout-success`,
                cancel_url: `${process.env.CLIENT_URL}/cart`,
            });

            res.redirect(303, session.url);
        });




        app.post("/ssl-payment-success", async (req, res) => {

            try {
                const result = await orderCollection.updateOne({ tran_id: req.body.tran_id }, {
                    $set: {
                        val_id: req.body.val_id
                    }
                })

                res.redirect(`https://emotionproducts.vercel.app/ssl-payment-success/${req.body.tran_id}`)
            } catch (error) {
                console.log(error);
            }

        })

        app.post("/ssl-payment-fail", async (req, res) => {
            try {
                const result = await orderCollection.deleteOne({ tran_id: req.body.tran_id })

                res.redirect(`https://emotionproducts.vercel.app`)
            } catch (error) {
                console.log(error);
            }
        })

        app.post("/ssl-payment-cancel", async (req, res) => {
            try {
                const result = await orderCollection.deleteOne({ tran_id: req.body.tran_id })

                res.redirect(`https://emotionproducts.vercel.app`)
            } catch (error) {
                console.log(error);
            }
        })

        app.post("/ssl-payment-notification", (req, res) => {
            try {
                console.log(req.body)
                res.send(req.body);
            } catch (error) {
                console.log(error);
            }
        })

        app.post('/validate', async (req, res) => {
            try {
                const result = await orderCollection.findOne({
                    tran_id: req.body.tran_id
                })

                if (result.val_id === req.body.val_id) {
                    const update = await orderCollection.updateOne({ tran_id: req.body.tran_id }, {
                        $set: {
                            paymentStatus: 'paymentComplete'
                        }
                    })
                    console.log(update);
                    res.send(update.modifiedCount > 0)

                }
                else {
                    res.send("Chor detected")
                }
            } catch (error) {
                console.log(error);
            }

        })

        app.get('/orders/:tran_id', async (req, res) => {
            try {
                const id = req.params.tran_id;
                const result = await orderCollection.findOne({ tran_id: id })
                res.json(result)
            } catch (error) {
                console.log(error);
            }
        })

        app.get('/orders', async (req, res) => {
            try {
                const query = {};
                const result = await orderCollection.find(query).toArray()
                res.json(result)
            } catch (error) {
                console.log(error);
            }
        })


    }
    finally {

    }
}


run().catch(console.dir);


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`.white.bgRed)
})