export interface User {
    username: string;
    first_name: string;
    last_name: string;
    hashedpass: string;
    salt: string;
    admin: boolean;
    last_coin_claim: string;
    coins: number;
}

