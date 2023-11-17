import axios from "axios";
import { url } from "./consts";
import { TradeOffer, TradeOfferWithCards } from "../interfaces/trade_offer";

export async function getAllTradeOffers(){
    let res : any = await axios.get(url + "/trade-offers");
    return res.data;
    // res.data.tradeOffers contains an array of TradeOfferCard objects
}

export async function getTradeOffersForUser(username: string){
    let res : any = await axios.get(url + "/trade-offers/" + username);
    return res.data;
}

export async function createTradeOffer(offer : TradeOfferWithCards){
    let res : any = await axios.post(url + "/trade-offers", offer);
    return res.data;
}

export async function deleteTradeOffer(id: number){
    let res : any = await axios.delete(url + "/trade-offers/" + id);
    return res.data;
}

export async function acceptTradeOffer(id: number){
    let res : any = await axios.post(url + "/trade-offers/accept/" + id);
    return res.data;
}