import { CardFromOffer } from "./card";

export interface TradeOffer{
    id: number;
    username: string;
    last_edit: string;
}

export interface TradeOfferWithCards extends TradeOffer{
    offering: CardFromOffer[];
    wanting: CardFromOffer[];
}