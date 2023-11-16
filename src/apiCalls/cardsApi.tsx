import axios from "axios";
import { url } from "./consts";
import { User } from "../interfaces/user";
import { Card } from "../interfaces/card";


// /cards

export async function getAllCards(){
    let res : any = await axios.get(url + "/cards");
    return res.data;
}

export async function createCard(card : Card){
    let res : any = await axios.post(url + "/cards", card);
    return res.data;
}

export async function updateCard(card : Card){
    let res : any = await axios.put(url + "/cards", card);
    return res.data;
}

export async function deleteCard(card : Card){
    let res : any = await axios.delete(url + "/cards/" + card.id);
    return res.data;
}


// /cards/:id
export async function getCard(id : number|string){
    let res : any = await axios.get(url + "/cards/" + id);
    return res.data;
}

// /users/:username/cards
export async function getCardsForUser(username : string){
    let res : any = await axios.get(url + "/users/" + username + "/cards");
    return res.data;
}

export async function addCardToUser(username : string, card : Card){
    let res : any = await axios.post(url + "/users/" + username + "/cards", card.id);
    return res.data;
}

export async function removeCardFromUser(username : string, card : Card){
    let res : any = await axios.delete(url + "/users/" + username + "/cards/" + card.id);
    return res.data;
}


// pack opening

export async function getTimeOnServer(){
    let res : any = await axios.get(url + "/current-time");
    return res.data;
}

export async function openPack(){
    let res : any = await axios.get(url + "/open-pack");
    return res.data;
}