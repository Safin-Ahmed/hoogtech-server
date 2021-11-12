const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json())

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

        // GET Method for loading products
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        })

        // GET METHOD for loading Orders
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { cus_email: email };
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.json(orders);
            console.log(orders);
        })

        // POST Method for Sending Orders to database
        app.post('/orders', async (req, res) => {
            const doc = req.body;
            const result = await ordersCollection.insertOne(doc);
            res.json(result);
        })

        // POST METHOD for sending users to database
        app.post('/users')

        // Delete Method For Deleting Order
        app.delete('/orders', async (req, res) => {
            const id = req.query.id;
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.json(result);
        })

        // PUT METHOD for cancelling an order 
        app.put('/orders', async (req, res) => {
            const id = req.query.id;
            console.log(id);
            const filter = { _id: ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: 'cancelled'
                },
            };
            const result = await ordersCollection.updateOne(filter, updateDoc);
            res.json(result);
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