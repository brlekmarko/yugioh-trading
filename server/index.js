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
const winston = require("winston");
const initialCoins = 10000;
const coinClaimReward = 5000;

app.use(express.json());


// logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'server' },
  transports: [
    new winston.transports.File({ filename: 'server.log', maxsize: 1000000 }), // 1MB
  ],
});

const errorLogger = winston.createLogger({
  level: 'error',
  format: winston.format.json(),
  defaultMeta: { service: 'server' },
  transports: [
    new winston.transports.File({ filename: 'error.log', maxsize: 1000000 }), // 1MB
  ],
});

app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    time: new Date().toISOString(),
    body: req.body,
    session: req.session,
    cookies: req.cookies,
    user: req.session ? req.session.user : null
  });
  next();
});


app.use(cookieParser());

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false 
}));

client.connect().catch(e => {
  console.log(e);
  errorLogger.error({errorMessage: "Could not connect to database", error: e, time: new Date().toISOString()});
  process.exit(1);
});

//cors
const cors = require("cors");
app.use(cors());

// endpoints
const url = "/api";

//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// login, logout, userinfo

app.post(url + "/login", jsonParser, async (req, res) => {
  try{
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
  } catch (e) {
    // send status code 500 if something went wrong
    errorLogger.error({errorMessage: "Could not login user", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/logout", (req, res) => {
  try{
    req.session.destroy();
    res.sendStatus(200);
  } catch (e) {
    // send status code 500 if something went wrong
    errorLogger.error({errorMessage: "Could not logout user", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/user", (req, res) => {
  try{
    if (!req.session.user) {
      // send status code 401 if user is not logged in
      res.sendStatus(401);
      return;
    }
    res.json({ user: req.session.user });
  } catch (e) {
    // send status code 500 if something went wrong
    errorLogger.error({errorMessage: "Could not get user info from session", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
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

  try{
    const users = await client.query(queries.getAllUsers());
    res.json({ users: users.rows });
  } catch (e) {
    // send status code 500 if something went wrong
    errorLogger.error({errorMessage: "Could not get list of all users", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.post(url + "/users", jsonParser, async (req, res) => {
  try{
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
    const last_coin_claim = new Date();
    last_coin_claim.setHours(last_coin_claim.getHours() - 48);

    const user = {
      username,
      first_name,
      last_name,
      hashedpass,
      salt,
      last_coin_claim: last_coin_claim.toISOString(),
      admin: false,
      coins: initialCoins
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
      errorLogger.error({errorMessage: "Could not persist new user to database", error: e, time: new Date().toISOString()});
      res.sendStatus(500);
      return;
    }
  } catch (e) {
    // send status code 500 if something went wrong
    console.log(e);
    errorLogger.error({errorMessage: "Error while creating new user", error: e, time: new Date().toISOString()});
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

  const { username, hashedpass, salt, first_name, last_name, admin, last_coin_claim, coins} = req.body;
  const user = {
    username,
    hashedpass,
    salt,
    first_name,
    last_name,
    admin,
    last_coin_claim,
    coins
  };
  try {
    await client.query(queries.updateUser(user));
    res.sendStatus(200);
    return;
  } catch (e) {
    // send status code 500 if something went wrong
    errorLogger.error({errorMessage: "Could not update user", error: e, time: new Date().toISOString()});
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
    errorLogger.error({errorMessage: "Could not delete user from database", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/users/:username", async (req, res) => {
  try{
    const username = req.params.username;
    const user = await client.query(queries.getUser(username));
    if (!user.rows[0]) {
      // send status code 404 if user does not exist
      res.sendStatus(404);
      return;
    }
    res.json({ user: user.rows[0] });
  } catch (e) {
    // send status code 500 if something went wrong
    errorLogger.error({errorMessage: "Could not get user info from database by username", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});



//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// cards (CRUD)
// GET, POST, PUT, DELETE

app.get(url + "/cards", async (req, res) => {
  try{
    const cards = await client.query(queries.getAllCards());
    res.json({ cards: cards.rows });
  } catch (e) {
    // send status code 500 if something went wrong
    errorLogger.error({errorMessage: "Could not get list of all cards", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
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
    errorLogger.error({errorMessage: "Could not create new card", error: e, time: new Date().toISOString()});
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
    errorLogger.error({errorMessage: "Could not update card", error: e, time: new Date().toISOString()});
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
    errorLogger.error({errorMessage: "Could not delete card", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/cards/:id", async (req, res) => {
  try{
    const id = req.params.id;
    const card = await client.query(queries.getCard(id));
    res.json({ card: card.rows[0] });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not get card info from database by id", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// users/username/cards
// GET, POST, DELETE

app.get(url + "/users/:username/cards", async (req, res) => {
  try{
    const username = req.params.username;
    const cards = await client.query(queries.getAllUserCards(username));
    res.json({ cards: cards.rows });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not get list of all cards for user", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
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
    errorLogger.error({errorMessage: "Could not add card to user", error: e, time: new Date().toISOString()});
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
    errorLogger.error({errorMessage: "Could not remove card from user", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// pack opening

app.get(url + "/current-time", (req, res) => {
  try{
    res.json({ time: new Date().toISOString() });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not get current time", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
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
    const lastPackOpening = new Date(user.rows[0].last_coin_claim);
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
    user.rows[0].last_coin_claim = now.toISOString();
    await client.query(queries.addCardToUser(username, randomCard1));
    await client.query(queries.addCardToUser(username, randomCard2));
    await client.query(queries.updateUser(user.rows[0]));
    req.session.user.last_coin_claim = now.toISOString();
    await client.query("COMMIT");
    res.json({ cards: [randomCard1, randomCard2] });
  }
  catch(e){
    await client.query("ROLLBACK");
    errorLogger.error({errorMessage: "Could not open pack", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/claim-coins", async (req, res) => {
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }
  client.query("BEGIN");
  try{

    const username = req.session.user.username;
    const user = await client.query(queries.getUser(username));
    const lastCoinClaim = new Date(user.rows[0].last_coin_claim);
    const now = new Date();
    const timeSinceLastCoinClaim = now.getTime() - lastCoinClaim.getTime();
    const hoursSinceLastCoinClaim = timeSinceLastCoinClaim / 1000 / 60 / 60;
    if (hoursSinceLastCoinClaim < 12) { // if less than 12 hours since last coin claim
      res.status(400).json({ message: "Need to wait before claiming coins again"});
      return;
    }
    user.rows[0].coins += coinClaimReward;
    user.rows[0].last_coin_claim = now.toISOString();
    await client.query(queries.updateUser(user.rows[0]));
    req.session.user.coins = user.rows[0].coins;
    req.session.user.last_coin_claim = user.rows[0].last_coin_claim;
    await client.query("COMMIT");
    res.json({ coins: user.rows[0].coins, last_coin_claim: user.rows[0].last_coin_claim });
  }
  catch(e){
    await client.query("ROLLBACK");
    errorLogger.error({errorMessage: "Could not claim coins", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});


//////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// trade offers

app.get(url + "/trade-offers", async (req, res) => {
  try{
    const tradeOffers = await client.query(queries.getAllTradeOffers());
    for(let tradeOffer of tradeOffers.rows){
      const offeringCards = await client.query(queries.getOfferedCardsForTradeOffer(tradeOffer.id));
      const wantingCards = await client.query(queries.getWantedCardsForTradeOffer(tradeOffer.id));
      tradeOffer.offering = offeringCards.rows;
      tradeOffer.wanting = wantingCards.rows;
    }
    res.json({ tradeOffers: tradeOffers.rows });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not get list of all trade offers", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.post(url + "/trade-offers", jsonParser, async (req, res) => {
  try{
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
      errorLogger.error({errorMessage: "Could not create trade offer", error: e, time: new Date().toISOString()});
      res.sendStatus(500);
      return;
    }
  } catch (e) {
    errorLogger.error({errorMessage: "Could not prepare trade offer", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});


app.delete(url + "/trade-offers/:id", async (req, res) => {
  try{
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
      errorLogger.error({errorMessage: "Could not delete trade offer", error: e, time: new Date().toISOString()});
      res.sendStatus(500);
      return;
    }
  } catch (e) {
    errorLogger.error({errorMessage: "Could not prepare trade offer for deletion", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});


app.get(url + "/trade-offers/:username", async (req, res) => {
  try{
    const username = req.params.username;
    const tradeOffers = await client.query(queries.getTradeOffersForUser(username));
    for(let tradeOffer of tradeOffers.rows){
      const offeringCards = await client.query(queries.getOfferedCardsForTradeOffer(tradeOffer.id));
      const wantingCards = await client.query(queries.getWantedCardsForTradeOffer(tradeOffer.id));
      tradeOffer.offering = offeringCards.rows;
      tradeOffer.wanting = wantingCards.rows;
    }
    res.json({ tradeOffers: tradeOffers.rows });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not get list of all trade offers for user", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
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
    errorLogger.error({errorMessage: "Could not accept trade offer", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
    }
});


//////////////////////////////////////////////////////
/// PACKS
//////////////////////////////////////////////////////

app.get(url + "/packs", async (req, res) => {
  try{
    const packs = await client.query(queries.getAllPacks());
    res.json({ packs: packs.rows });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not get list of all packs", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.post(url + "/packs", jsonParser, async (req, res) => {
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

  const { name, price, description, image, type, collection } = req.body;
  const pack = {
    name,
    price,
    description,
    image,
    type,
    collection
  };
  try {
    const result = await client.query(queries.createPack(pack));
    res.status(201).json({ id: result.rows[0].id });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not create new pack", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.put(url + "/packs", jsonParser, async (req, res) => {
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

  const { id, name, price, description, image, type, collection } = req.body;
  const pack = {
    id,
    name,
    price,
    description,
    image,
    type,
    collection
  };
  try {
    await client.query(queries.updatePack(pack));
    res.sendStatus(200);
    return;
  } catch (e) {
    errorLogger.error({errorMessage: "Could not update pack", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/packs/:id", async (req, res) => {
  try{
    const id = req.params.id;
    const pack = await client.query(queries.getPack(id));
    const cardsInPack = await client.query(queries.getCardsByCollectionAndType(pack.rows[0].collection, pack.rows[0].type));
    pack.rows[0].cards = cardsInPack.rows;
    res.json({ pack: pack.rows[0] });
  } catch (e) {
    errorLogger.error({errorMessage: "Could not get pack info from database by id", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.delete(url + "/packs/:id", async (req, res) => {
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
    await client.query(queries.deletePack(id));
    res.sendStatus(200);
    return;
  } catch (e) {
    errorLogger.error({errorMessage: "Could not delete pack", error: e, time: new Date().toISOString()});
    res.sendStatus(500);
    return;
  }
});

app.get(url + "/packs/open/:id", async (req, res) => {
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }
  client.query("BEGIN");
  try{

    const username = req.session.user.username;
    const pack = await client.query(queries.getPack(req.params.id));

    // check if user has enough coins
    const user = await client.query(queries.getUser(username));
    if(user.rows[0].coins < pack.rows[0].price){
      res.status(400).json({ message: "Not enough coins to open this pack"});
      return;
    }

    // deduce coins from user
    user.rows[0].coins -= pack.rows[0].price;
    // fix time format
    user.rows[0].last_coin_claim = new Date(user.rows[0].last_coin_claim).toISOString();
    await client.query(queries.updateUser(user.rows[0]));
    req.session.user.coins = user.rows[0].coins;
    
    // get random cards from pack
    const cards = await client.query(queries.getAllCards());

    const randomCard1 = cards.rows[Math.floor(Math.random() * cards.rows.length)]; // get random card
    await client.query(queries.addCardToUser(username, randomCard1)); // add card to user

    const randomCard2 = cards.rows[Math.floor(Math.random() * cards.rows.length)];
    await client.query(queries.addCardToUser(username, randomCard2));


    await client.query("COMMIT");
    res.json({ cards: [randomCard1, randomCard2], coins: user.rows[0].coins });
  }
  catch(e){
    await client.query("ROLLBACK");
    errorLogger.error({errorMessage: "Could not open pack", error: e, time: new Date().toISOString()});
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
    errorLogger.error({errorMessage: "Could not initialize database", error: e, time: new Date().toISOString()});
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
    errorLogger.error({errorMessage: "Could not initialize ownership table", error: e, time: new Date().toISOString()});
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
    errorLogger.error({errorMessage: "Could not initialize trade offers table", error: e, time: new Date().toISOString()});
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