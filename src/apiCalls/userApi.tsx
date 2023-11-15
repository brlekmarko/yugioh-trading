import axios from "axios";
import { url } from "./consts";
import { User } from "../interfaces/user";

export async function loginUser(username: string, password: string){
    let res : any = await axios.post(url + "/login", {username, password});
    return res.data;
}

export async function registerUser(username: string, password: string, first_name: string, last_name: string){
    let res : any = await axios.post(url + "/register", {username, password, first_name, last_name});
    return res.data;
}

export async function getUser(){
    let res : any = await axios.get(url + "/user");
    return res.data;
}

export async function logoutUser(){
    let res : any = await axios.get(url + "/logout");
    return res.data;
}
