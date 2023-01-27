const AWS = require("aws-sdk");
const express = require("express");
const bodyParser = require('body-parser');
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient();

app.use(express.json());
app.use(bodyParser.json());

// Create user
app.post("/users", async (req, res) => {
  const { userId, name } = req.body;
  if (typeof userId !== "string") {
    res.status(400).json({ error: '"userId" must be a string' });
  } else if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ userId, name });
  } catch (error) {
    res.status(500).json({ error: "Could not create user" });
  }
});

// Get users
app.get("/users", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
  };

  try {
    const users = await dynamoDbClient.scan(params).promise();
    res.json(users.Items)
  } catch (error) {
    res.status(500).json({ error: "Could not find any users." });
  }
});

// Get specific user
app.get("/users/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

// Update user
app.put("/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;

  if (!userId || !name) {
    res.status(400).json({ error: 'userId and name are required' });
    return;
  }

  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
    UpdateExpression: 'set #name = :n',
    ExpressionAttributeNames: {
      '#name': 'name'
    },
    ExpressionAttributeValues: {
      ':n': name
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    const result = await dynamoDbClient.update(params).promise();
    res.json({ message: 'User updated', user: result.Attributes });
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve user" });
  }
})

// Delete user
app.get("/users/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    await dynamoDbClient.delete(params).promise();
    res.json({ message: `User with userId: ${userId} has been deleted` });
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve user" });
  }
})

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
