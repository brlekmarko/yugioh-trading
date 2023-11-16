const express = require("express");
const app = express(); // create express app
const path = require("path");
const { client } = require("./database/client");
const queries = require("./database/dbQueries");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const sessions = require("express-session");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const initialDb = require("./database/initialDb");


app.use(cookieParser());

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

client.connect();

//cors
const cors = require("cors");
app.use(cors());

// endpoints
const url = "/api";

// login, logout, userinfo

app.post(url + "/login", jsonParser, async (req, res) => {
  const { username, password } = req.body;
  const possibleUser = await client.query(queries.getUser(username));
  const user = possibleUser.rows[0];
  if (!user) {
    res.json({ success: false });
    return;
  }
  // need to hash password with sha256 using salt from db
  const hashedpass = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha256').toString('hex');
  if (hashedpass !== user.hashedpass) {
    res.json({ success: false });
    return;
  }
  req.session.user = user;
  res.json({ success: true });
});

app.get(url + "/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get(url + "/user", (req, res) => {
  if (!req.session.user) {
    res.json({ success: false });
    return;
  }
  res.json({ success: true, user: req.session.user });
});

// users (CRUD)
// GET, POST, PUT, DELETE

app.get(url + "/users", async (req, res) => {
  // admin only
  if (!req.session.user || !req.session.user.admin) {
    res.json({ success: false });
    return;
  }

  const users = await client.query(queries.getAllUsers());
  res.json({ success: true, users: users.rows });
});

app.post(url + "/users", jsonParser, async (req, res) => {
  const { username, password, first_name, last_name } = req.body;
  const possibleUser = await client.query(queries.getUser(username));
  if (possibleUser.rows[0]) { // if user already exists
    res.json({ success: false });
    return;
  }
  const salt = crypto.randomBytes(16).toString("hex"); // generate random salt
  const hashedpass = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  // make last pack opening 48 hours ago
  const last_pack_opening = new Date();
  last_pack_opening.setHours(last_pack_opening.getHours() - 48);

  const user = {
    username,
    first_name,
    last_name,
    hashedpass,
    salt,
    last_pack_opening: last_pack_opening.toISOString(),
    admin: false,
  };
  try {
    await client.query(queries.createUser(user)); // create user in db
    req.session.user = user;
    res.json({ success: true, user: user });
  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});

app.put(url + "/users", jsonParser, async (req, res) => {
  // admin only
  if (!req.session.user || !req.session.user.admin) {
    res.json({ success: false });
    return;
  }
  const { username, hashedpass, salt, first_name, last_name, admin, last_pack_opening} = req.body;
  const user = {
    username,
    hashedpass,
    salt,
    first_name,
    last_name,
    admin,
    last_pack_opening
  };
  try {
    await client.query(queries.updateUser(user));
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});

app.delete(url + "/users/:username", async (req, res) => {

  const username = req.params.username;
  // admin only, or user deleting their own account
  if (!req.session.user || (!req.session.user.admin && req.session.user.username !== username)) {
    res.json({ success: false });
    return;
  }
  try {
    await client.query(queries.deleteUser(username));
    res.json({ success: true });
  } catch (e) {
    console.log(e);
    res.json({ success: false });
  }
});



app.use(express.static(path.join(__dirname, "..", "build")));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});


async function initializeDatabase(){
  // check if database is empty, if so, fill it with initial data
  await client.query("BEGIN");
  try{
  
    // users
    const users = await client.query(queries.getAllUsers());
    if (users.rows.length === 0) {
      const initialUsers = initialDb.initialUsers();
      for (let user of initialUsers) {
        await client.query(queries.createUser(user));
      }
    }
    // cards
    const cards = await client.query(queries.getAllCards());
    if (cards.rows.length === 0) {
      const initialCards = initialDb.initialCards();
      for (let card of initialCards) {
        await client.query(queries.createCard(card));
      }
    }
  
    await client.query("COMMIT");
  
  } catch (e) {
    console.log(e);
    await client.query("ROLLBACK");
  }
}

async function initializeOwnership(){
  // check if ownership table is empty, if so, fill it with initial data
  const ownerships = await client.query(queries.getAllOwnerships());
  if(ownerships.rows.length > 0){
    return;
  }

  await client.query("BEGIN");

  try{

    const initialOwnership = initialDb.initialOwnership();
    for (let ownership of initialOwnership) {
      await client.query(queries.addCardToUserByName(ownership.username, ownership.card_name));
    }
    await client.query("COMMIT")
  }
  catch(e){
    await client.query("ROLLBACK");
  }

}




// start express server on port 5000
app.listen(5000, async () => {
  console.log("server started on port 5000");
  await initializeDatabase();
  await initializeOwnership();
});