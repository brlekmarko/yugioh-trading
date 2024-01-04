import axios from "axios";
import { url } from "./consts";

export async function claimCoins(){
    let res : any = await axios.get(url + "/claim-coins");
    return res.data;
}