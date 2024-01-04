import axios from "axios";
import { url } from "./consts";
import { Pack } from "../interfaces/pack";

export async function getAllPacks(){
    let res : any = await axios.get(url + "/packs");
    return res.data;
}

export async function getPackById(id: number){
    let res : any = await axios.get(url + "/packs/" + id);
    return res.data;
}

export async function createPack(pack : Pack){
    let res : any = await axios.post(url + "/packs", pack);
    return res.data;
}

export async function updatePack(pack : Pack){
    let res : any = await axios.put(url + "/packs", pack);
    return res.data;
}

export async function deletePack(id: number){
    let res : any = await axios.delete(url + "/packs/" + id);
    return res.data;
}

export async function openPack(id: number){
    let res : any = await axios.get(url + "/packs/open/" + id);
    return res.data;
}