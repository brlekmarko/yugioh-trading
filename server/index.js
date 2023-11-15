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

app.post(url + "/login", jsonParser, async (req, res) => {
  const { username, password } = req.body;
  const possibleUser = await client.query(queries.getUser(username));
  const user = possibleUser.rows[0];
  if (!user) {
    res.json({ success: false });
    return;
  }
  // need to hash password with sha256 using salt from db
  const hashedPassword = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha256').toString('hex');
  if (hashedPassword !== user.hashedpass) {
    res.json({ success: false });
    return;
  }
  req.session.user = user;
  res.json({ success: true });
});

app.post(url + "/register", jsonParser, async (req, res) => {
  const { username, password, first_name, last_name } = req.body;
  const possibleUser = await client.query(queries.getUser(username));
  if (possibleUser.rows[0]) { // if user already exists
    res.json({ success: false });
    return;
  }
  const salt = crypto.randomBytes(16).toString("hex"); // generate random salt
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  // make last pack opening 48 hours ago
  const last_pack_opening = new Date();
  last_pack_opening.setHours(last_pack_opening.getHours() - 48);

  const user = {
    username,
    first_name,
    last_name,
    hashedpass: hashedPassword,
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



// app.post("/api/createTournament", jsonParser, async (req, res) => {
//   client.query("BEGIN");
//   try{
//     const tournament = req.body;
//     if (tournament.natjecatelji.length < 4 || tournament.natjecatelji.length > 8) {
//       res.json({ id: -1 });
//       return;
//     }

//     const dbres = await client.query(queries.newTournamentCreateNatjecanje(tournament));
//     const id = dbres.rows[0].idnatjecanje;

//     const natjecateljires = await client.query(queries.newTournamentCreateNatjecatelji(id, tournament));
//     const natjecatelji = natjecateljires.rows;
//     let natjecateljiIds = [];
//     for(let i = 0; i < natjecatelji.length; i++){
//         natjecateljiIds.push(natjecatelji[i].idnatjecatelj);
//     }

//     const idkolares = await client.query(queries.newTournamentCreateKola(id, tournament, natjecateljiIds));
//     const idkola = idkolares.rows;
//     let idkolaIds = [];
//     for(let i = 0; i < idkola.length; i++){
//         idkolaIds.push(idkola[i].idigra);
//     }

//     res.json({ id: id
//     });
//     client.query("COMMIT");
//   }catch(e){
//     client.query("ROLLBACK");
//     console.log(e);
//     res.json({ id: -1 });
//   }

// });



app.use(express.static(path.join(__dirname, "..", "build")));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "..", "build", "index.html"));
});


// start express server on port 5000
app.listen(5000, () => {
  console.log("server started on port 5000");
});