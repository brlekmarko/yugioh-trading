const request = require('supertest');
const index = require('./index');
const app = index.app;
const url = "/api";

// before all, empty the database, fill it with initial data
beforeAll(async () => {
    const emptyDatabase = index.emptyDatabase;
    await emptyDatabase();
    await index.initializeDatabase();
    await index.initializeOwnership();
    await index.initializeTradeOffers();
});


// login, logout and register tests

test('tries to login with nonexistent user', async () => {
    await request(app).post(url + '/login').send({username: 'nonexistent', password: 'nonexistent'}).expect(401);
});

test('creates a new user', async () => {
    await request(app).post(url + '/users').send({username: 'probni', password: 'korisnik', first_name: 'Probni', last_name: 'Korisnik'}).expect(201);
});

test('tries to create a user with an existing username', async () => {
    await request(app).post(url + '/users').send({username: 'probni', password: 'korisnik', first_name: 'Probni', last_name: 'Korisnik'}).expect(409);
});

test('tries to login with wrong password', async () => {
    await request(app).post(url + '/login').send({username: 'probni', password: 'krivi'}).expect(401);
});

test('tries to login with correct password', async () => {
    await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'}).expect(200);
});

test('tries to login and logout', async () => {
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    await request(app).get(url + '/logout').set('Cookie', `connect.sid=${value}`).expect(200);
});


// user tests

test('tries to get all users while being admin', async () => {
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    await request(app).get(url + '/users').set('Cookie', `connect.sid=${value}`).expect(200);
});

test('tries to get all users while not being admin', async () => {
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    await request(app).get(url + '/users').set('Cookie', `connect.sid=${value}`).expect(403);
});

test('tries to get a user by username', async () => {
    await request(app).get(url + '/users/probni').expect(200);
});

test('tries to get a nonexistent user by username', async () => {
    await request(app).get(url + '/users/nonexistent').expect(404);
});

test('admin tries to update a user', async () => {
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    let oldUser = await request(app).get(url + '/users/probni');
    oldUser = oldUser.body.user;

    await request(app).put(url + '/users').set('Cookie', `connect.sid=${value}`).send({...oldUser, first_name: 'Novi', last_name: 'Korisnik'}).expect(200);
    // check if the user was updated
    const updatedUser = await request(app).get(url + '/users/probni');
    expect(updatedUser.body.user.first_name).toEqual('Novi');
    expect(updatedUser.body.user.last_name).toEqual('Korisnik');
});

test('user tries to delete his own account', async () => {
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    await request(app).delete(url + '/users/probni').set('Cookie', `connect.sid=${value}`).expect(200);
});

test('non-admin tries to delete another user', async () => {
    // need to register
    await request(app).post(url + '/users').send({username: 'probni', password: 'korisnik', first_name: 'Probni', last_name: 'Korisnik'}).expect(201);
    await request(app).post(url + '/users').send({username: 'probni2', password: 'korisnik', first_name: 'Probni2', last_name: 'Korisnik2'}).expect(201);
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    await request(app).delete(url + '/users/probni2').set('Cookie', `connect.sid=${value}`).expect(403);
});

test('try to fetch all cards', async () => {
    const cards = await request(app).get(url + '/cards').expect(200);
    expect(cards.body.cards.length).toEqual(require('./database/initialDb').initialCards().length);
});

test('admin creates a new card', async () => {
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    await request(app).post(url + '/cards').set('Cookie', `connect.sid=${value}`).send({name: 'New Card', type: 'Spell', description: 'New Card Description', image: 'New Card Image'}).expect(201);
});

test('user tries to create a new card', async () => {
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    await request(app).post(url + '/cards').set('Cookie', `connect.sid=${value}`).send({name: 'New Card', type: 'Spell', description: 'New Card Description', image: 'New Card Image'}).expect(403);
});

test('get a card by id', async () => {
    // first we create a new card
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    const newCard = await request(app).post(url + '/cards').set('Cookie', `connect.sid=${value}`).send({name: 'New Card', type: 'Spell', description: 'New Card Description', image: 'New Card Image'}).expect(201);

    const cardId = newCard.body.id;
    const card = await request(app).get(url + '/cards/' + cardId).expect(200);
    expect(card.body.card.name).toEqual('New Card');
});

test('admin tries to update a card', async () => {
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    const cards = await request(app).get(url + '/cards').expect(200);
    const card = cards.body.cards.find(card => card.name === 'New Card');
    await request(app).put(url + '/cards').set('Cookie', `connect.sid=${value}`).send({...card, description: 'Updated Card Description'}).expect(200);

    // check if the card was updated
    const updatedCard = await request(app).get(url + '/cards/' + card.id).expect(200);
    expect(updatedCard.body.card.description).toEqual('Updated Card Description');
});

test('user tries to update a card', async () => {
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    const cards = await request(app).get(url + '/cards').expect(200);
    const card = cards.body.cards.find(card => card.name === 'New Card');
    await request(app).put(url + '/cards').set('Cookie', `connect.sid=${value}`).send({...card, description: 'Updated Card Description'}).expect(403);
});


test('admin tries to delete a card', async () => {
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    const cards = await request(app).get(url + '/cards').expect(200);
    const card = cards.body.cards.find(card => card.name === 'New Card');
    await request(app).delete(url + '/cards/' + card.id).set('Cookie', `connect.sid=${value}`).expect(200);
});


// card ownership tests

test('fetch all cards owned by a user', async () => {
    const cards = await request(app).get(url + '/users/probni/cards').expect(200);
    expect(cards.body.cards.length).toEqual(1); // initial winged kuriboh
});

test('admin gives a card to a user', async () => {
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    const cards = await request(app).get(url + '/cards').expect(200);
    const card = cards.body.cards.find(card => card.name === 'New Card');
    await request(app).post(url + '/users/probni/cards').set('Cookie', `connect.sid=${value}`).send({id: card.id}).expect(200);

    // check if the card was added to the user
    const userCards = await request(app).get(url + '/users/probni/cards').set('Cookie', `connect.sid=${value}`).expect(200);
    expect(userCards.body.cards.length).toEqual(2);
});

test('admin deletes a card from a user', async () => {
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    const cards = await request(app).get(url + '/cards').expect(200);
    const card = cards.body.cards.find(card => card.name === 'New Card');
    await request(app).delete(url + '/users/probni/cards/' + card.id).set('Cookie', `connect.sid=${value}`).expect(200);

    // check if the card was deleted from the user
    const userCards = await request(app).get(url + '/users/probni/cards').set('Cookie', `connect.sid=${value}`).expect(200);
    expect(userCards.body.cards.length).toEqual(1);
});


// pack opening tests

test('user opens a pack', async () => {
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    await request(app).get(url + '/open-pack').set('Cookie', `connect.sid=${value}`).expect(200);

    // check if the pack was opened
    const userCards = await request(app).get(url + '/users/probni/cards').set('Cookie', `connect.sid=${value}`).expect(200);
    expect(userCards.body.cards.length).toEqual(3); // 1 initial winged kuriboh + 2 from the pack
});

test('user tries to open another pack, without 12 hours passing', async () => {
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    await request(app).get(url + '/open-pack').set('Cookie', `connect.sid=${value}`).expect(400);
});

test('open pack without being logged in', async () => {
    await request(app).get(url + '/open-pack').expect(401);
});


// trade offer tests

test('fetch all trade offers', async () => {
    const tradeOffers = await request(app).get(url + '/trade-offers').expect(200);
    expect(tradeOffers.body.tradeOffers.length).toEqual(require('./database/initialDb').initialTradeOffers().length);
});

test('user creates a trade offer', async () => {
    // first we need to login
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    // then we need to fetch all cards
    const cards = await request(app).get(url + '/cards').expect(200);
    const newCard = cards.body.cards.find(card => card.name === 'New Card');
    newCard.id_card = newCard.id;
    const kuriboh = cards.body.cards.find(card => card.name === 'Winged Kuriboh');
    kuriboh.id_card = kuriboh.id;
    const offering = [kuriboh];
    const wanting = [newCard];

    await request(app).post(url + '/trade-offers').set('Cookie', `connect.sid=${value}`).send({offering: offering, wanting: wanting}).expect(201);

    // check if the trade offer was created
    const tradeOffers = await request(app).get(url + '/trade-offers').expect(200);
    expect(tradeOffers.body.tradeOffers.length).toEqual(require('./database/initialDb').initialTradeOffers().length + 1);
});


test('get trade offers by user', async () => {
    const tradeOffers = await request(app).get(url + '/trade-offers/probni').expect(200);
    expect(tradeOffers.body.tradeOffers.length).toEqual(1);
});

test('user deletes his own trade offer', async () => {
    // first we need to login
    const login = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    // then we need to fetch his trade offers
    const tradeOffers = await request(app).get(url + '/trade-offers/probni').expect(200);
    // and delete the first one
    await request(app).delete(url + '/trade-offers/' + tradeOffers.body.tradeOffers[0].id).set('Cookie', `connect.sid=${value}`).expect(200);

    // check if the trade offer was deleted
    const tradeOffersAfter = await request(app).get(url + '/trade-offers/probni').expect(200);
    expect(tradeOffersAfter.body.tradeOffers.length).toEqual(0);
});


test('user accepts a trade offer', async () => {
    // we need to login as admin and give users some cards
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];

    // give probni2 a Blue-Eyes White Dragon card
    const cards = await request(app).get(url + '/cards').expect(200);
    const blueeyes = cards.body.cards.find(card => card.name === 'Blue-Eyes White Dragon');
    blueeyes.id_card = blueeyes.id;
    await request(app).post(url + '/users/probni2/cards').set('Cookie', `connect.sid=${value}`).send({id: blueeyes.id}).expect(200);

    // give probni a Blue-Eyes Ultimate Dragon card
    const blueeyesultimate = cards.body.cards.find(card => card.name === 'Blue-Eyes Ultimate Dragon');
    blueeyesultimate.id_card = blueeyesultimate.id;
    await request(app).post(url + '/users/probni/cards').set('Cookie', `connect.sid=${value}`).send({id: blueeyesultimate.id}).expect(200);

    const kuriboh = cards.body.cards.find(card => card.name === 'Winged Kuriboh');
    kuriboh.id_card = kuriboh.id;

    // now login as probni and create a trade offer
    const login2 = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie2 = login2.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value2 = cookie2.split(';')[0].split('=')[1];
    const offering = [blueeyesultimate];
    const wanting = [blueeyes];
    await request(app).post(url + '/trade-offers').set('Cookie', `connect.sid=${value2}`).send({offering: offering, wanting: wanting}).expect(201);


    // now login as probni2 and accept the trade offer
    const login3 = await request(app).post(url + '/login').send({username: 'probni2', password: 'korisnik'});
    const cookie3 = login3.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value3 = cookie3.split(';')[0].split('=')[1];
    // first we need to fetch the trade offer
    const tradeOffers = await request(app).get(url + '/trade-offers/probni').expect(200);
    // and accept the first one
    await request(app).post(url + '/trade-offers/accept/' + tradeOffers.body.tradeOffers[0].id).set('Cookie', `connect.sid=${value3}`).expect(200);

    // check if the trade offer was deleted
    const tradeOffersAfter = await request(app).get(url + '/trade-offers/probni').expect(200);
    expect(tradeOffersAfter.body.tradeOffers.length).toEqual(0);

    // check if the cards were traded
    const userCards = await request(app).get(url + '/users/probni/cards').set('Cookie', `connect.sid=${value3}`).expect(200);
    expect(userCards.body.cards.length).toEqual(4); // 1 winged kuriboh + 2 from pack + 1 blue-eyes ultimate dragon
    const userCards2 = await request(app).get(url + '/users/probni2/cards').set('Cookie', `connect.sid=${value3}`).expect(200);
    expect(userCards2.body.cards.length).toEqual(2); // 1 initial winged kuriboh + 1 blue-eyes white dragon
});

test('user creates a trade offer without having enough cards', async () => {
    // first we login as admin and create a new card
    const login = await request(app).post(url + '/login').send({username: 'masteradmin', password: 'masteradmin'});
    const cookie = login.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value = cookie.split(';')[0].split('=')[1];
    let newCard = {
        name: 'Made up card',
        type: 'Spell',
        description: 'Made up card Description',
        image: 'Made up card Image'
    };
    let cardId = await request(app).post(url + '/cards').set('Cookie', `connect.sid=${value}`).send(newCard).expect(201);
    newCard.id_card = cardId.body.id;
    let offering = [newCard]; // user for sure doesn't have this card

    // now login as probni and create a trade offer
    const login2 = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie2 = login2.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value2 = cookie2.split(';')[0].split('=')[1];

    let cards = await request(app).get(url + '/cards').expect(200);
    let blueeyes = cards.body.cards.find(card => card.name === 'Blue-Eyes White Dragon');
    blueeyes.id_card = blueeyes.id;
    let wanting = [blueeyes];
    
    await request(app).post(url + '/trade-offers').set('Cookie', `connect.sid=${value2}`).send({offering: offering, wanting: wanting}).expect(400);
});

test('user tries to accept a trade offer without having enough cards', async () => {
    
    let cards = await request(app).get(url + '/cards').expect(200);
    let kuriboh = cards.body.cards.find(card => card.name === 'Winged Kuriboh');
    kuriboh.id_card = kuriboh.id;
    let offering = [kuriboh]; // user for sure has this card
    let newCard = cards.body.cards.find(card => card.name === 'Made up card');
    newCard.id_card = newCard.id;
    let wanting = [newCard]; // user for sure doesn't have this card

    // now login as probni and create a trade offer
    const login2 = await request(app).post(url + '/login').send({username: 'probni', password: 'korisnik'});
    const cookie2 = login2.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value2 = cookie2.split(';')[0].split('=')[1];
    await request(app).post(url + '/trade-offers').set('Cookie', `connect.sid=${value2}`).send({offering: offering, wanting: wanting}).expect(201);

    // now login as probni2 and accept the trade offer
    const login3 = await request(app).post(url + '/login').send({username: 'probni2', password: 'korisnik'});
    const cookie3 = login3.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
    const value3 = cookie3.split(';')[0].split('=')[1];
    // first we need to fetch the trade offer
    const tradeOffers = await request(app).get(url + '/trade-offers/probni').expect(200);
    // and accept the first one
    await request(app).post(url + '/trade-offers/accept/' + tradeOffers.body.tradeOffers[0].id).set('Cookie', `connect.sid=${value3}`).expect(400);
    // probni2 doesn't have the card he wants to give
});
