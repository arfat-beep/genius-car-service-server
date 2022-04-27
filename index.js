const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();

// middlewares
app.use(cors());
app.use(express.json());

// verify token
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authoraization;
  // console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  // console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    // console.log("token : ", token);
    console.log("decoded : ", decoded);
    // console.log("error : ", err);
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xcb5a.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("Services");
    const orderCollection = client.db("geniusCar").collection("Order");

    // Authentication Token
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // showing all data in UI
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // show single data in UI
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // post a data in database
    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    // Deleting a service from database
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    // post a data in database for order
    app.post("/order", async (req, res) => {
      const newOrder = req.body;
      const result = await orderCollection.insertOne(newOrder);
      res.send(result);
    });

    // showing all order which ordered by particular user
    app.get("/order", verifyJWT, async (req, res) => {
      const decodedEmail = req?.decoded?.email;
      // console.log(req.decoded);
      const email = req.query.email;
      // console.log(email);
      // console.log(decodedEmail);
      if (email === decodedEmail) {
        const query = { email };
        const cursor = orderCollection.find(query);
        const order = await cursor.toArray();
        res.send(order);
      } else {
        res.status(403).send({ message: "Forbidden access" });
      }
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This is Running");
});
app.listen(port, () => {
  console.log("Genius server is running");
});
