export interface User {
    username: string;
    first_name: string;
    last_name: string;
    hashedPassword: string;
    salt: string;
    admin: boolean;
    last_pack_opening: string;
}

