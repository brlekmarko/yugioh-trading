import axios from "axios";
import { url } from "./consts";
import { User } from "../interfaces/user";

export async function loginUser(username: string, password: string){
    let res : any = await axios.post(url + "/login", {username, password});
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

export async function getAllUsers(){
    let res : any = await axios.get(url + "/users");
    return res.data;
}

export async function registerUser(username: string, password: string, first_name: string, last_name: string){
    let res : any = await axios.post(url + "/users", {username, password, first_name, last_name});
    return res.data;
}

export async function updateUser(user: User){
    let res : any = await axios.put(url + "/users", user);
    return res.data;
}

export async function deleteUser(username: string){
    let res : any = await axios.delete(url + "/users/" + username);
    return res.data;
}