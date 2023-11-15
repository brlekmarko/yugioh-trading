import { useEffect, useState } from "react";
import { User } from "../../interfaces/user";
import { deleteUser, getUser, logoutUser } from "../../apiCalls/userApi";
import { Button } from "primereact/button";

export default function ProfilePage(){

    let [user, setUser] = useState<User>();

    async function DeleteUser(username: string|undefined){
        if(!username){
            return;
        }
        
        let res = await deleteUser(username);
        setUser(undefined);
        await logoutUser();
        window.location.href = "/";
    }

    useEffect(() => {
        async function fetchUser() {
            const res : any = await getUser();
            if(res.success){
                setUser(res.user);
                return;
            }
            setUser(undefined);
        }
        fetchUser();
    },[]);

    return (
        <div className="ProfilePage">
            {user ? <>
                <h1>Profile</h1>
                <p>Username: {user.username}</p>
                <p>First Name: {user.first_name}</p>
                <p>Last Name: {user.last_name}</p>
                <p>Admin: {user.admin ? "Yes" : "No"}</p>
                <Button label="Delete Account" onClick={() => DeleteUser(user?.username)} />
            </> : <h1>Not logged in</h1>}
        </div>
    );
}