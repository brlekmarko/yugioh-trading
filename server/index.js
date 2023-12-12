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
require("dotenv").config();


app.use(cookieParser());

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: process.env.SESSION_SECRET,
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

//////////////////////////////////////////////////////
// get documentation
app.get("/", async(req, res) => {
  // open documentation from file doc.txt
  const fs = require("fs");
  fs.readFile("doc.json", "utf8", (err, data) => {
    if(err){
      res.sendStatus(500);
      return;
    }
    // send it to user as a json object
    res.send(JSON.parse(data));
  });
});


//////////////////////////////////////////////////////
// login, logout, userinfo

app.post(url + "/login", jsonParser, async (req, res) => {
  const { username, password } = req.body;
  const possibleUser = await client.query(queries.getUser(username));
  const user = possibleUser.rows[0];
  if (!user) {
    // send status code 401 if user does not exist
    res.sendStatus(401);
    return;
  }
  // need to hash password with sha256 using salt from db
  const hashedpass = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha256').toString('hex');
  if (hashedpass !== user.hashedpass) {
    res.sendStatus(401);
    return;
  }
  req.session.user = user;
  res.sendStatus(200);
});

app.get(url + "/logout", (req, res) => {
  req.session.destroy();
  res.sendStatus(200);
});

app.get(url + "/user", (req, res) => {
  if (!req.session.user) {
    // send status code 401 if user is not logged in
    res.sendStatus(401);
    return;
  }
  res.json({ user: req.session.user });
});



//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// users (CRUD)
// GET, POST, PUT, DELETE

app.get(url + "/users", async (req, res) => {
  // admin only
  // if not logged in, 401
  // if not admin, 403
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if(!req.session.user.admin){
    res.sendStatus(403);
    return;
  }

  const users = await client.query(queries.getAllUsers());
  res.json({ users: users.rows });
});

app.post(url + "/users", jsonParser, async (req, res) => {
  const { username, password, first_name, last_name } = req.body;
  const possibleUser = await client.query(queries.getUser(username));
  if (possibleUser.rows[0]) { // if user already exists
    // send status code 409 if user already exists
    res.sendStatus(409);
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
    res.status(201).json({ user: user });

    try{
      // give user Winged Kuriboh as a starter card
      await client.query(queries.addCardToUserByName(username, "Winged Kuriboh"));
    }
    catch(e){
      // no kuriboh card in db, do nothing
    }
  } catch (e) {
    // send status code 500 if something went wrong
    console.log(e);
    res.sendStatus(500);
    return;
  }
});

app.put(url + "/users", jsonParser, async (req, res) => {
  // admin only
  // if not logged in, 401
  // if not admin, 403
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if(!req.session.user.admin){
    res.sendStatus(403);
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
    res.sendStatus(200);
    return;
  } catch (e) {
    // send status code 500 if something went wrong
    res.sendStatus(500);
    return;
  }
});

app.delete(url + "/users/:username", async (req, res) => {

  const username = req.params.username;
  // admin only, or user deleting their own account
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if (!req.session.user.admin && req.session.user.username !== username) {
    res.sendStatus(403);
    return;
  }

  try {
    // need to first delete all ownerships of this user
    await client.query(queries.deleteAllOwnershipsFromUser(username));
    // need to delete all trade offers that this user created
    await client.query(queries.deleteAllTradeOffersFromUser(username));
    // now we can delete the user
    await client.query(queries.deleteUser(username));
    res.sendStatus(200);
    return;
  } catch (e) {
    // send status code 500 if something went wrong
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/users/:username", async (req, res) => {
  const username = req.params.username;
  const user = await client.query(queries.getUser(username));
  if (!user.rows[0]) {
    // send status code 404 if user does not exist
    res.sendStatus(404);
    return;
  }
  res.json({ user: user.rows[0] });
});



//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// cards (CRUD)
// GET, POST, PUT, DELETE

app.get(url + "/cards", async (req, res) => {
  const cards = await client.query(queries.getAllCards());
  res.json({ cards: cards.rows });
});

app.post(url + "/cards", jsonParser, async (req, res) => {
  // admin only
  // if not logged in, 401
  // if not admin, 403
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if(!req.session.user.admin){
    res.sendStatus(403);
    return;
  }

  const { name, type, description, image } = req.body;
  const card = {
    name,
    type,
    description,
    image
  };
  try {
    const result = await client.query(queries.createCard(card));
    res.status(201).json({ id: result.rows[0].id });
  } catch (e) {
    res.sendStatus(500);
    return;
  }
});

app.put(url + "/cards", jsonParser, async (req, res) => {
  // admin only
  // if not logged in, 401
  // if not admin, 403
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if(!req.session.user.admin){
    res.sendStatus(403);
    return;
  }

  const { id, name, type, description, image } = req.body;
  const card = {
    id,
    name,
    type,
    description,
    image
  };
  try {
    await client.query(queries.updateCard(card));
    res.sendStatus(200);
    return;
  } catch (e) {
    res.sendStatus(500);
    return;
  }
});

app.delete(url + "/cards/:id", async (req, res) => {
  // admin only
  // if not logged in, 401
  // if not admin, 403
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if(!req.session.user.admin){
    res.sendStatus(403);
    return;
  }

  const id = req.params.id;
  try {
    // need to first delete all ownerships of this card
    await client.query(queries.deleteAllOwnershipsOfCard(id));
    // need to delete all trade offers that have this card
    const result = await client.query(queries.getTradeOffersWithThisCard(id));
    const tradeOfferIds = result.rows;
    for(let tradeOfferId of tradeOfferIds){
      await client.query(queries.deleteTradeOffer(tradeOfferId));
    }
    // now we can delete the card
    await client.query(queries.deleteCard(id));
    res.sendStatus(200);
    return;
  } catch (e) {
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/cards/:id", async (req, res) => {
  const id = req.params.id;
  const card = await client.query(queries.getCard(id));
  res.json({ card: card.rows[0] });
});


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// users/username/cards
// GET, POST, DELETE

app.get(url + "/users/:username/cards", async (req, res) => {
  const username = req.params.username;
  const cards = await client.query(queries.getAllUserCards(username));
  res.json({ cards: cards.rows });
});

app.post(url + "/users/:username/cards", jsonParser, async (req, res) => {
  const username = req.params.username;
  // admin only
  // if not logged in, 401
  // if not admin, 403
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if(!req.session.user.admin){
    res.sendStatus(403);
    return;
  }

  const { id } = req.body;
  try {
    // check if card exists
    const card = await client.query(queries.getCard(id));
    if (card.rows.length === 0) {
      // send status code 400 if card does not exist
      res.status(400).json({ message: "Card does not exist" });
    }
    await client.query(queries.addCardToUser(username, card.rows[0]));
    res.sendStatus(200);
    return;
  } catch (e) {
    res.sendStatus(500);
    return;
  }
});

app.delete(url + "/users/:username/cards/:id", async (req, res) => {
  const username = req.params.username;
  const id = req.params.id;
  // admin only, or user deleting their own card
  if (!req.session.user){
    res.sendStatus(401);
    return;
  }
  if (!req.session.user.admin && req.session.user.username !== username) {
    res.sendStatus(403);
    return;
  }

  try {
    await client.query(queries.removeCardFromUser(username, id));
    res.sendStatus(200);
    return;
  } catch (e) {
    res.sendStatus(500);
    return;
  }
});


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// pack opening

app.get(url + "/current-time", (req, res) => {
  res.json({ time: new Date().toISOString() });
});

app.get(url + "/open-pack", async (req, res) => {
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }
  client.query("BEGIN");
  try{

    const username = req.session.user.username;
    const user = await client.query(queries.getUser(username));
    const lastPackOpening = new Date(user.rows[0].last_pack_opening);
    const now = new Date();
    const timeSinceLastPackOpening = now.getTime() - lastPackOpening.getTime();
    const hoursSinceLastPackOpening = timeSinceLastPackOpening / 1000 / 60 / 60;
    if (hoursSinceLastPackOpening < 12) { // if less than 12 hours since last pack opening
      res.status(400).json({ message: "Need to wait before opening another pack"});
      return;
    }
    const cards = await client.query(queries.getAllCards());
    const randomCard1 = cards.rows[Math.floor(Math.random() * cards.rows.length)]; // get random card
    const randomCard2 = cards.rows[Math.floor(Math.random() * cards.rows.length)];
    user.rows[0].last_pack_opening = now.toISOString();
    await client.query(queries.addCardToUser(username, randomCard1));
    await client.query(queries.addCardToUser(username, randomCard2));
    await client.query(queries.updateUser(user.rows[0]));
    req.session.user.last_pack_opening = now.toISOString();
    await client.query("COMMIT");
    res.json({ cards: [randomCard1, randomCard2] });
  }
  catch(e){
    await client.query("ROLLBACK");
    res.sendStatus(500);
    return;
  }
});


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// trade offers

app.get(url + "/trade-offers", async (req, res) => {
  const tradeOffers = await client.query(queries.getAllTradeOffers());
  for(let tradeOffer of tradeOffers.rows){
    const offeringCards = await client.query(queries.getOfferedCardsForTradeOffer(tradeOffer.id));
    const wantingCards = await client.query(queries.getWantedCardsForTradeOffer(tradeOffer.id));
    tradeOffer.offering = offeringCards.rows;
    tradeOffer.wanting = wantingCards.rows;
  }
  res.json({ tradeOffers: tradeOffers.rows });
});

app.post(url + "/trade-offers", jsonParser, async (req, res) => {
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  const username = req.session.user.username;
  const { offering, wanting } = req.body; // array of card objects with attribute id_card
  const offeringIds = offering.map(card => card.id_card); //createOfferingCards expects array of ids
  const wantingIds = wanting.map(card => card.id_card); //same

  // first we check if user has all the cards he is offering
  const userCards = await client.query(queries.getAllUserCards(username));
  const userCardsIds = userCards.rows.map(card => card.id);
  for(let cardId of offeringIds){
    if(!userCardsIds.includes(cardId)){
      res.status(400).json({ message: "User does not have all the cards he is offering"});
      return;
    }
    userCardsIds.filter(id => id !== cardId); // remove card from userCardsIds, needed when multiple of same card
  }

  client.query("BEGIN");
  try{
    const result = await client.query(queries.createTradeOffer(username));
    const id = result.rows[0].id;

    await client.query(queries.createOfferingCards(id, offeringIds));
    await client.query(queries.createWantingCards(id, wantingIds));

    await client.query("COMMIT");

    // send an updated list of trade offers back
    const tradeOffers = await client.query(queries.getAllTradeOffers());
    for(let tradeOffer of tradeOffers.rows){
      const offeringCards = await client.query(queries.getOfferedCardsForTradeOffer(tradeOffer.id));
      const wantingCards = await client.query(queries.getWantedCardsForTradeOffer(tradeOffer.id));
      tradeOffer.offering = offeringCards.rows;
      tradeOffer.wanting = wantingCards.rows;
    }

    res.status(201).json({ tradeOffers: tradeOffers.rows });
  }catch(e){
    await client.query("ROLLBACK");
    res.sendStatus(500);
    return;
  }
});


app.delete(url + "/trade-offers/:id", async (req, res) => {
  const id = req.params.id;
  // admin only or user deleting their own trade offer
  if(!req.session.user){
    res.sendStatus(401);
    return;
  }

  // need to find out who created the trade offer
  const tradeOffer = await client.query(queries.getTradeOffer(id));
  const username = tradeOffer.rows[0].username;
  if (!req.session.user.admin && req.session.user.username !== username) {
    res.sendStatus(403);
    return;
  }

  try {
    await client.query(queries.deleteTradeOffer(id));
    res.sendStatus(200);
    return;
  } catch (e) {
    res.sendStatus(500);
    return;
  }
});


app.get(url + "/trade-offers/:username", async (req, res) => {
  const username = req.params.username;
  const tradeOffers = await client.query(queries.getTradeOffersForUser(username));
  for(let tradeOffer of tradeOffers.rows){
    const offeringCards = await client.query(queries.getOfferedCardsForTradeOffer(tradeOffer.id));
    const wantingCards = await client.query(queries.getWantedCardsForTradeOffer(tradeOffer.id));
    tradeOffer.offering = offeringCards.rows;
    tradeOffer.wanting = wantingCards.rows;
  }
  res.json({ tradeOffers: tradeOffers.rows });
});


app.post(url + "/trade-offers/accept/:id", async (req, res) => {

  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  client.query("BEGIN");

  try{
    const id = req.params.id;
    const username = req.session.user.username;
    const tradeOffer = await client.query(queries.getTradeOffer(id));
    // check if user accepting his own trade offer
    if (tradeOffer.rows[0].username === username) {
      res.status(400).json({ message: "User accepting his own trade offer"});
      return;
    }

    // check if user has all the cards he is offering
    const offeringCards = await client.query(queries.getOfferedCardsForTradeOffer(id));
    const offeringCardsIds = offeringCards.rows.map(card => card.id_card);
    const userOfferingCards = await client.query(queries.getAllUserCards(tradeOffer.rows[0].username));
    const userOfferingCardsIds = userOfferingCards.rows.map(card => card.id);
    for(let cardId of offeringCardsIds){
      if(!userOfferingCardsIds.includes(cardId)){
        res.status(400).json({ message: "User does not have all the cards he is offering"});
        return;
      }
      userOfferingCardsIds.filter(id => id !== cardId); // remove card from userOfferingCardsIds, needed when multiple of same card
    }

    // check if we have all the cards he wants
    const wantingCards = await client.query(queries.getWantedCardsForTradeOffer(id));
    const wantingCardsIds = wantingCards.rows.map(card => card.id_card);
    const userWantingCards = await client.query(queries.getAllUserCards(username));
    const userWantingCardsIds = userWantingCards.rows.map(card => card.id);
    for(let cardId of wantingCardsIds){
      if(!userWantingCardsIds.includes(cardId)){
        res.status(400).json({ message: "We do not have all the cards he wants"});
        return;
      }
      userWantingCardsIds.filter(id => id !== cardId); // remove card from userWantingCardsIds, needed when multiple of same card
    }

    // good to go, do the trade

    // remove cards from user who created the trade offer
    for(let cardId of offeringCardsIds){
      await client.query(queries.removeCardFromUser(tradeOffer.rows[0].username, cardId));
    }
    // remove cards from user who accepted the trade offer
    for(let cardId of wantingCardsIds){
      await client.query(queries.removeCardFromUser(username, cardId));
    }

    // add cards to user who created the trade offer
    await client.query(queries.addCardsToUser(tradeOffer.rows[0].username, wantingCardsIds));
    // add cards to user who accepted the trade offer
    await client.query(queries.addCardsToUser(username, offeringCardsIds));

    // delete trade offer
    await client.query(queries.deleteTradeOffer(id));

    await client.query("COMMIT");


    // need to delete both users' trade offers that no longer have sufficient cards
    /////////////////////////////////////////////////

    // delete trade offers of user who created the trade offer
    const tradeOffers1 = await client.query(queries.getTradeOffersForUser(tradeOffer.rows[0].username));
    const userOfferingCards1 = await client.query(queries.getAllUserCards(tradeOffer.rows[0].username));
    const userOfferingCardsIds1 = userOfferingCards1.rows.map(card => card.id);
    for(let tradeOffer1 of tradeOffers1.rows){
      const offeringCards1 = await client.query(queries.getOfferedCardsForTradeOffer(tradeOffer1.id));
      const offeringCardsIds1 = offeringCards1.rows.map(card => card.id_card);
      const userOfferingCardsIds1Copy = [...userOfferingCardsIds1];
      for(let cardId of offeringCardsIds1){
        if(!userOfferingCardsIds1Copy.includes(cardId)){
          await client.query(queries.deleteTradeOffer(tradeOffer1.id));
          break;
        }
        userOfferingCardsIds1Copy.filter(id => id !== cardId); // remove card from userOfferingCardsIds1Copy, needed when multiple of same card
      }
    }

    // delete trade offers of user who accepted the trade offer
    const tradeOffers2 = await client.query(queries.getTradeOffersForUser(username));
    const userOfferingCards2 = await client.query(queries.getAllUserCards(username));
    const userOfferingCardsIds2 = userOfferingCards2.rows.map(card => card.id);
    for(let tradeOffer2 of tradeOffers2.rows){
      const offeringCards2 = await client.query(queries.getOfferedCardsForTradeOffer(tradeOffer2.id));
      const offeringCardsIds2 = offeringCards2.rows.map(card => card.id_card);
      const userOfferingCardsIds2Copy = [...userOfferingCardsIds2];
      for(let cardId of offeringCardsIds2){
        if(!userOfferingCardsIds2Copy.includes(cardId)){
          await client.query(queries.deleteTradeOffer(tradeOffer2.id));
          break;
        }
        userOfferingCardsIds2Copy.filter(id => id !== cardId); // remove card from userOfferingCardsIds2Copy, needed when multiple of same card
      }
    }

    const newTradeOffers = await client.query(queries.getAllTradeOffers());
    for(let newTradeOffer of newTradeOffers.rows){
      const newOfferingCards = await client.query(queries.getOfferedCardsForTradeOffer(newTradeOffer.id));
      const newWantingCards = await client.query(queries.getWantedCardsForTradeOffer(newTradeOffer.id));
      newTradeOffer.offering = newOfferingCards.rows;
      newTradeOffer.wanting = newWantingCards.rows;
    }

    await client.query("COMMIT");
    res.json({ tradeOffers: newTradeOffers.rows});

  } catch (e) {
    await client.query("ROLLBACK");
    res.sendStatus(500);
    return;
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

async function initializeTradeOffers(){
  // check if trade offers table is empty, if so, fill it with initial data
  const tradeOffers = await client.query(queries.getAllTradeOffers());
  if(tradeOffers.rows.length > 0){
    return;
  }

  await client.query("BEGIN");

  try{
      const initialTradeOffers = initialDb.initialTradeOffers();

      for (let tradeOffer of initialTradeOffers) {
        const result = await client.query(queries.createTradeOffer(tradeOffer.username));
        const id = result.rows[0].id;

        const offeringCardsIds = [];
        const wantingCardsIds = [];

        for(let cardName of tradeOffer.offering){
          const card = await client.query(queries.getCardByName(cardName));
          offeringCardsIds.push(card.rows[0].id);
        }
        await client.query(queries.createOfferingCards(id, offeringCardsIds));

        for(let cardName of tradeOffer.wanting){
          const card = await client.query(queries.getCardByName(cardName));
          wantingCardsIds.push(card.rows[0].id);
        }
        await client.query(queries.createWantingCards(id, wantingCardsIds));
      }

      await client.query("COMMIT")
  }catch(e){
    console.log(e);
    await client.query("ROLLBACK");
  }

}


if(process.env.NODE_ENV === "test"){
  const emptyDatabase = async () => {
    await client.query(queries.emptyDatabase());
    return;
  }
  module.exports = { app, emptyDatabase, initializeDatabase, initializeOwnership, initializeTradeOffers };
}
else{
  // start express server on port 5000
  app.listen(5000, async () => {
    console.log("server started on port 5000");
    await initializeDatabase();
    await initializeOwnership();
    await initializeTradeOffers();
  });
}