/// CRUD for users

function getAllUsers(){
    return "SELECT username, first_name, last_name, hashedpass, salt, last_coin_claim, admin, coins FROM USERS"
}

function getUser(username){
    return "SELECT username, first_name, last_name, hashedpass, salt, last_coin_claim, admin, coins FROM USERS WHERE username = '" + username + "'";
}

function createUser(user){
    return "INSERT INTO USERS (username, first_name, last_name, hashedpass, salt, last_coin_claim, admin, coins) VALUES " + 
    "('" + user.username + "', '" + user.first_name + "', '" + user.last_name + "', '" + user.hashedpass + "', '" + 
    user.salt + "', '" + user.last_coin_claim + "', '" + user.admin + "', '" + user.coins + "') RETURNING username;";
}

function updateUser(user){
    return "UPDATE USERS SET first_name = '" + user.first_name + "', last_name = '" + user.last_name + "', hashedpass = '" + 
    user.hashedpass + "', salt = '" + user.salt + "', last_coin_claim = '" + user.last_coin_claim + "', admin = '" + 
    user.admin + "', coins = '" + user.coins + "' WHERE username = '" + user.username + "'";
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

function getCardsByCollectionAndType(collection, type){
    return `SELECT id, name, type, description, image FROM CARDS WHERE collection = $$${collection}$$ AND type = $$${type}$$`;
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

function addCardsToUser(username, cards){

    if(cards.length == 0){
        return "";
    }

    // cards is an array of card ids
    let query = `INSERT INTO OWNERSHIP (username, id_card) VALUES `;
    for(let i = 0; i < cards.length; i++){
        query += `('${username}', ${cards[i]})`;
        if(i < cards.length - 1){
            query += ", ";
        }
    }
    return query;
}

function addCardToUserByName(username, card_name){
    return `INSERT INTO OWNERSHIP (username, id_card) VALUES ('${username}', (SELECT id FROM cards WHERE name = '${card_name}'))`;
}

function removeCardFromUser(username, id){
    return `DELETE FROM OWNERSHIP WHERE id IN (SELECT id FROM ownership WHERE username = '${username}' AND id_card = ${id} LIMIT 1)`; // if user has multiple copies of the same card, only delete one
}

function deleteAllOwnershipsFromUser(username){
    return `DELETE FROM ownership WHERE username = '${username}'`;
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

function getTradeOffersWithThisCard(id){
    return `SELECT id_trade_offer FROM offering WHERE id_card = ${id} UNION SELECT id_trade_offer FROM wanting WHERE id_card = ${id}`;
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
    return `DELETE FROM offering WHERE id_trade_offer = ${id}; DELETE FROM wanting WHERE id_trade_offer = ${id}; DELETE FROM trade_offers WHERE id = ${id};`;
}

function deleteAllTradeOffersFromUser(username){
    // delete trade offer, delete offering, delete wanting
    return `DELETE FROM offering WHERE id_trade_offer IN (SELECT id FROM trade_offers WHERE username = '${username}'); ` +
    `DELETE FROM wanting WHERE id_trade_offer IN (SELECT id FROM trade_offers WHERE username = '${username}'); ` +
    `DELETE FROM trade_offers WHERE username = '${username}';`;
}

function emptyDatabase(){
    return `DELETE FROM offering; DELETE FROM wanting; DELETE FROM trade_offers; DELETE FROM ownership; DELETE FROM users; DELETE FROM cards;`;
}


// CRUD for packs

function getAllPacks(){
    return "SELECT id, name, price, description, image, collection, type FROM PACKS"
}

function getPack(id){
    return `SELECT id, name, price, description, image, collection, type FROM PACKS WHERE id = ${id}`;
}

function createPack(pack){
    if (!Number.isInteger(pack.price)) {
        price = parseInt(pack.price);
        if (isNaN(price)) {
            throw new Error('Price must be an integer');
        }
    }
    return `INSERT INTO PACKS (name, price, description, image, collection, type) VALUES 
    ($$${pack.name}$$, $$${pack.price}$$, $$${pack.description}$$, $$${pack.image}$$, $$${pack.collection}$$, $$${pack.type}$$) RETURNING id`;
}

function updatePack(pack){
    return `UPDATE PACKS SET name = $$${pack.name}$$, price = $$${pack.price}$$, description = $$${pack.description}$$, image = $$${pack.image}$$, collection = $$${pack.collection}$$, type = $$${pack.type}$$ WHERE id = ${pack.id}`;
}

function deletePack(id){
    return `DELETE FROM PACKS WHERE id = ${id}`;
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
    getCardsByCollectionAndType,
    createCard,
    updateCard,
    deleteCard,
    getAllOwnerships,
    getAllUserCards,
    addCardToUser,
    addCardsToUser,
    addCardToUserByName,
    removeCardFromUser,
    deleteAllOwnershipsOfCard,
    deleteAllOwnershipsFromUser,
    getAllTradeOffers,
    getTradeOffer,
    getWantedCardsForTradeOffer,
    getOfferedCardsForTradeOffer,
    getTradeOffersWithThisCard,
    getTradeOffersForUser,
    createTradeOffer,
    createOfferingCards,
    createWantingCards,
    deleteTradeOffer,
    deleteAllTradeOffersFromUser,
    emptyDatabase,
    getAllPacks,
    getPack,
    createPack,
    updatePack,
    deletePack
}
