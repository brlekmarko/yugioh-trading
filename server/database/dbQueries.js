/// CRUD for users

function getAllUsers(){
    return "SELECT username, first_name, last_name, hashedpass, salt, last_pack_opening, admin FROM USERS"
}

function getUser(username){
    return "SELECT username, first_name, last_name, hashedpass, salt, last_pack_opening, admin FROM USERS WHERE username = '" + username + "'";
}

function createUser(user){
    return "INSERT INTO USERS (username, first_name, last_name, hashedpass, salt, last_pack_opening, admin) VALUES " + 
    "('" + user.username + "', '" + user.first_name + "', '" + user.last_name + "', '" + user.hashedpass + "', '" + 
    user.salt + "', '" + user.last_pack_opening + "', '" + user.admin + "') RETURNING username;";
}

function updateUser(user){
    return "UPDATE USERS SET first_name = '" + user.first_name + "', last_name = '" + user.last_name + "', hashedpass = '" + 
    user.hashedpass + "', salt = '" + user.salt + "', last_pack_opening = '" + user.last_pack_opening + "', admin = '" + 
    user.admin + "' WHERE username = '" + user.username + "'";
}

function deleteUser(username){
    return "DELETE FROM USERS WHERE username = '" + username + "'";
}


/// CRUD for cards

function getAllCards(){
    return "SELECT id, name, type, description FROM CARDS"
}

function getCard(id){
    return "SELECT id, name, type, description FROM CARDS WHERE id = " + id;
}

function createCard(card){
    return "INSERT INTO CARDS (name, type, description) VALUES " +
    "('" + card.name + "', '" + card.type + "', '" + card.description + "') RETURNING id;";
}

function updateCard(card){
    return "UPDATE CARDS SET name = '" + card.name + "', type = '" + card.type + "', description = '" + card.description + "' WHERE id = " + card.id;
}

function deleteCard(id){
    return "DELETE FROM CARDS WHERE id = " + id;
}

// combination of users and cards

function getAllUserCards(username){
    return "SELECT id, name, type, description FROM CARDS WHERE id IN (SELECT id_card FROM OWNERSHIP WHERE username = '" + username + "')";
}

function addCardToUser(username, card){
    return "INSERT INTO OWNERSHIP (username, id_card) VALUES ('" + username + "', " + card.id + ")";
}

function removeCardFromUser(username, id){
    return "DELETE FROM OWNERSHIP WHERE username = '" + username + "' AND id_card = " + id + " LIMIT 1";
}

// trade offers

function getAllTradeOffers(){
    return "SELECT id, username, last_edit FROM trade_offers";
}

function getTradeOffer(id){
    return "SELECT id, username, last_edit FROM trade_offers WHERE id = " + id;
}

function getWantedCardsForTradeOffer(id){
    return "SELECT wanting.id_card, cards.name, cards.type, cards.description FROM trade_offers JOIN wanting ON trade_offers.id = wanting.id_trade_offer " +
    "JOIN cards ON wanting.id_card = cards.id WHERE trade_offers.id = " + id;
}

function getOfferedCardsForTradeOffer(id){
    return "SELECT offering.id_card, cards.name, cards.type, cards.description FROM trade_offers JOIN offering ON trade_offers.id = offering.id_trade_offer " +
    "JOIN cards ON offering.id_card = cards.id WHERE trade_offers.id = " + id;
}

function getTradeOffersForUser(username){
    return "SELECT id, username, last_edit FROM trade_offers WHERE username = '" + username + "'";
}

function createTradeOffer(username){
    return "INSERT INTO trade_offers (username, last_edit) VALUES ('" + username + "', CURRENT_TIMESTAMP) RETURNING id";
}

function createOfferingCards(id_trade_offer, id_cards){
    // id_cards is an array of ids
    let query = "INSERT INTO offering (id_trade_offer, id_card) VALUES ";
    for(let i = 0; i < id_cards.length; i++){
        query += "(" + id_trade_offer + ", " + id_cards[i] + ")";
        if(i < id_cards.length - 1){
            query += ", ";
        }
    }
    return query;
}

function createWantingCards(id_trade_offer, id_cards){
    // id_cards is an array of ids
    let query = "INSERT INTO wanting (id_trade_offer, id_card) VALUES ";
    for(let i = 0; i < id_cards.length; i++){
        query += "(" + id_trade_offer + ", " + id_cards[i] + ")";
        if(i < id_cards.length - 1){
            query += ", ";
        }
    }
    return query;
}

function deleteTradeOffer(id){
    // delete trade offer, delete offering, delete wanting
    return "DELETE FROM trade_offers WHERE id = " + id + "; DELETE FROM offering WHERE id_trade_offer = " + id + "; DELETE FROM wanting WHERE id_trade_offer = " + id;
}





module.exports = {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getAllCards,
    getCard,
    createCard,
    updateCard,
    deleteCard,
    getAllUserCards,
    addCardToUser,
    removeCardFromUser,
    getAllTradeOffers,
    getTradeOffer,
    getWantedCardsForTradeOffer,
    getOfferedCardsForTradeOffer,
    getTradeOffersForUser,
    createTradeOffer,
    createOfferingCards,
    createWantingCards,
    deleteTradeOffer
}
