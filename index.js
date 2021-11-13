const express = require('express');
const cors = require('cors');
var admin = require("firebase-admin");
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json())

var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function verifyToken(req, res, next) {
    if (req.headers?.authorization.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.jjl8x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db("hoogtech");
        console.log('Connected TO Database');
        const productsCollection = database.collection('products');
        const ordersCollection = database.collection('orders');
        const reviewsCollection = database.collection('reviews');
        const usersCollection = database.collection('users');

        // GET Method for loading products
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        // GET METHOD for loading Specific Orders
        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = { cus_email: email };
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
            console.log(orders);
        })

        // GET METHOD for loading all orders 
        app.get('/allOrders', verifyToken, async (req, res) => {

            const cursor = ordersCollection.find({});
            const orders = await cursor.toArray();
            res.json(orders);
            console.log(orders);


        })

        // GET METHOD for Loading Reviews 
        app.get('/reviews', async (req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        })

        // GET METHOD for Verifying Admin Role
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // POST METHOD For Adding Products 
        app.post('/products', verifyToken, async (req, res) => {
            const doc = req.body;
            const result = await productsCollection.insertOne(doc);
            res.json(result);
        })

        // POST METHOD for uploading reviews 
        app.post('/reviews', async (req, res) => {
            const doc = req.body;
            const result = await reviewsCollection.insertOne(doc);
            res.json(result);
        })

        // POST Method for Sending Orders to database
        app.post('/orders', async (req, res) => {
            const doc = req.body;
            const result = await ordersCollection.insertOne(doc);
            res.json(result);
        })

        // POST METHOD for sending users to database
        app.post('/users', async (req, res) => {
            const userInfo = req.body;
            const result = await usersCollection.insertOne(userInfo);
            res.json(result);
        })

        // Delete Method For Deleting Order
        app.delete('/orders', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })

        // DELETE method for Deleting Product 
        app.delete('/products', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        })

        // PUT METHOD for updating an order status 
        app.put('/orders', async (req, res) => {
            const id = req.query.id;
            const status = req.query.status;
            console.log(id);
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: status
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        // PUT METHOD FOR MAKING ADMIN 
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            console.log(requester);
            if (requester) {
                const requesterAccount = usersCollection.findOne({ email: requester });
                console.log(requesterAccount);
                if (requesterAccount.role == "admin") {
                    const filter = { email: user.email };
                    const updateDoc = {
                        $set: { role: 'admin' }
                    };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
                else {
                    res.status(403).json({ message: 'You do not have access to this page' });
                }
            }

        })
    }
    finally {
        // await client.close()
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Niche Product Server');
})
app.listen(port, () => {
    console.log('listening to the port', port);
})