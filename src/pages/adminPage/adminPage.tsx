import { useEffect, useState } from "react";
import { deleteUser, getAllUsers, getUser, updateUser } from "../../apiCalls/userApi";
import { User } from "../../interfaces/user";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from "primereact/button";
import './adminPage.css';

export default function AdminPage(){

    const [users, setUsers] = useState<User[]>([]);

    async function fetchAllUsers(){
        let res = await getAllUsers();
        if(res.success){
            // remove current user from list
            let user = await getUser();
            user = user.user;
            setUsers(res.users.filter((u: User) => u.username !== user.username));
            return;
        }
        setUsers([]);
        alert("Failed to fetch users");
    }

    async function DeleteUser(username:string){
        let res = await deleteUser(username);
        setUsers(users.filter(user => user.username !== username));
    }

    async function ToggleAdmin(user : User){
        user.admin = !user.admin;
        let res = await updateUser(user);
        if(res.success){
            setUsers(users.map(u => u.username === user.username ? user : u));
            return;
        }
        alert("Failed to toggle admin");
    }

    useEffect(() => {
        fetchAllUsers();
    },[]);

    return (
        <div className="AdminPage">
            <DataTable value={users}>
                <Column field="username" header="Username"></Column>
                <Column field="first_name" header="First Name"></Column>
                <Column field="last_name" header="Last Name"></Column>
                <Column field="admin" header="Admin"></Column>
                <Column header="Actions" body={(rowData:any) =>
                    <div className="admin-actions">
                        <Button label="Toggle Admin" onClick={() => ToggleAdmin(rowData)} />
                        <Button label="Delete" onClick={() => DeleteUser(rowData.username)} />
                    </div>
                }/>
            </DataTable>
        </div>
    );
}