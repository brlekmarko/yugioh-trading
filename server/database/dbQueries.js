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
    return "SELECT id, name, type, description, image FROM CARDS"
}

function getCard(id){
    return `SELECT id, name, type, description, image FROM CARDS WHERE id = ${id}`;
}

function getCardByName(name){
    return `SELECT id, name, type, description, image FROM CARDS WHERE name = $$${name}$$`;
}

function createCard(card){
    return `INSERT INTO CARDS (name, type, description, image) VALUES 
    ($$${card.name}$$, $$${card.type}$$, $$${card.description}$$, $$${card.image}$$) RETURNING id`;
}

function updateCard(card){
    return `UPDATE CARDS SET name = $$${card.name}$$, type = $$${card.type}$$, description = $$${card.description}$$, image = $$${card.image}$$ WHERE id = ${card.id}`;
}

function deleteCard(id){
    return `DELETE FROM CARDS WHERE id = ${id}`;
}

// combination of users and cards

function getAllOwnerships(){
    return "SELECT username, id_card FROM ownership";
}

function getAllUserCards(username){
    return `SELECT cards.id, cards.name, cards.type, cards.description, cards.image FROM ownership JOIN cards ON ownership.id_card = cards.id WHERE ownership.username = '${username}'`;
}

function addCardToUser(username, card){
    return `INSERT INTO OWNERSHIP (username, id_card) VALUES ('${username}', ${card.id})`;
}

function addCardToUserByName(username, card_name){
    return `INSERT INTO OWNERSHIP (username, id_card) VALUES ('${username}', (SELECT id FROM cards WHERE name = '${card_name}'))`;
}

function removeCardFromUser(username, id){
    return `DELETE FROM OWNERSHIP WHERE username = '${username}' AND id_card = ${id}`;
}

function deleteAllOwnershipsOfCard(id){
    return `DELETE FROM ownership WHERE id_card = ${id}`;
}

// trade offers

function getAllTradeOffers(){
    return "SELECT id, username, last_edit FROM trade_offers";
}

function getTradeOffer(id){
    return `SELECT id, username, last_edit FROM trade_offers WHERE id = ${id}`;
}

function getWantedCardsForTradeOffer(id){
    return `SELECT wanting.id_card, cards.name, cards.type, cards.description, cards.image FROM trade_offers JOIN wanting ON trade_offers.id = wanting.id_trade_offer ` +
    `JOIN cards ON wanting.id_card = cards.id WHERE trade_offers.id = ${id}`;
}

function getOfferedCardsForTradeOffer(id){
    return `SELECT offering.id_card, cards.name, cards.type, cards.description, cards.image FROM trade_offers JOIN offering ON trade_offers.id = offering.id_trade_offer ` +
    `JOIN cards ON offering.id_card = cards.id WHERE trade_offers.id = ${id}`;
}

function getTradeOffersForUser(username){
    return `SELECT id, username, last_edit FROM trade_offers WHERE username = '${username}'`;
}

function createTradeOffer(username){
    return `INSERT INTO trade_offers (username, last_edit) VALUES ('${username}', NOW()) RETURNING id`;
}

function createOfferingCards(id_trade_offer, id_cards){
    // id_cards is an array of ids
    let query = `INSERT INTO offering (id_trade_offer, id_card) VALUES `;
    for(let i = 0; i < id_cards.length; i++){
        query += `(${id_trade_offer}, ${id_cards[i]})`;
        if(i < id_cards.length - 1){
            query += ", ";
        }
    }
    return query;
}

function createWantingCards(id_trade_offer, id_cards){
    // id_cards is an array of ids
    let query = `INSERT INTO wanting (id_trade_offer, id_card) VALUES `;
    for(let i = 0; i < id_cards.length; i++){
        query += `(${id_trade_offer}, ${id_cards[i]})`;
        if(i < id_cards.length - 1){
            query += ", ";
        }
    }
    return query;
}

function deleteTradeOffer(id){
    // delete trade offer, delete offering, delete wanting
    return `DELETE FROM trade_offers WHERE id = ${id}; DELETE FROM offering WHERE id_trade_offer = ${id}; DELETE FROM wanting WHERE id_trade_offer = ${id}`;
}





module.exports = {
    getAllUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    getAllCards,
    getCard,
    getCardByName,
    createCard,
    updateCard,
    deleteCard,
    getAllOwnerships,
    getAllUserCards,
    addCardToUser,
    addCardToUserByName,
    removeCardFromUser,
    deleteAllOwnershipsOfCard,
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
