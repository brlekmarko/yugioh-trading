import { Card } from "./card";

export interface Pack{
    id: number;
    name: string;
    description: string;
    image: string;
    collection: string;
    type: string;
    price: number;
}

export interface PackWithCards extends Pack{
    cards: Card[];
}