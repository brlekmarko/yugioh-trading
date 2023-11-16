import { useEffect, useState } from "react";
import { deleteUser, getAllUsers, getUser, updateUser } from "../../apiCalls/userApi";
import { User } from "../../interfaces/user";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from "primereact/button";
import './adminPage.css';
import { createCard, deleteCard, getAllCards, updateCard } from "../../apiCalls/cardsApi";
import { Card } from "../../interfaces/card";
import { InputText } from "primereact/inputtext";
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";

export default function AdminPage(){

    const [users, setUsers] = useState<User[]>([]);
    const [searchUsers, setSearchUsers] = useState<string>("");
    const [cards, setCards] = useState<Card[]>([]);
    const [searchCards, setSearchCards] = useState<string>("");
    //popup
    const [visible, setVisible] = useState<boolean>(false);
    const [createThisCard, setCreateThisCard] = useState<Card>({} as Card);
    const [editing, setEditing] = useState<boolean>(false);


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

    function updateSearchUsers(e: any){
        setSearchUsers(e.target.value);
    }

    function updateSearchCards(e: any){
        setSearchCards(e.target.value);
    }

    async function fetchAllCards(){
        let res = await getAllCards();
        if(res.success){
            setCards(res.cards);
            return;
        }
        setCards([]);
        alert("Failed to fetch cards");
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

    async function DeleteCard(card:Card){
        let res = await deleteCard(card);
        setCards(cards.filter(c => c.id !== card.id));
    }

    async function EditCard(card:Card){
        setCreateThisCard(card);
        setEditing(true);
        setVisible(true);
    }

    async function CreateCard(){
        setCreateThisCard({} as Card);
        setEditing(false);
        setVisible(true);
    }

    useEffect(() => {
        fetchAllUsers();
        fetchAllCards();
    },[]);

    return (
        <div className="AdminPage">
            <div className="admin-users">
                <h1>Users</h1>
                <div style={{marginBottom: "10px"}}>
                    <InputText placeholder="Search" value={searchUsers} onChange={updateSearchUsers}/>
                </div>
                <DataTable value={users.filter(user => user.username.toLowerCase().includes(searchUsers.toLowerCase()))} scrollable scrollHeight="500px">
                <Column header="Username" body={(rowData:any) =>
                        <a href={"/profile/" + rowData.username} target="_blank">{rowData.username}</a>
                    }></Column>
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

            <div className="admin-cards">
                <h1>Cards</h1>
                <Button label="Create Card" onClick={CreateCard} />
                <div style={{marginBottom: "10px", marginTop: "10px"}}>
                    <InputText placeholder="Search" value={searchCards} onChange={updateSearchCards}/>
                </div>
                <DataTable value={cards.filter(card => card.name.toLowerCase().includes(searchCards.toLowerCase())).sort((a,b) => b.id - a.id)} 
                            scrollable scrollHeight="500px">
                    <Column header="Name" body={(rowData:any) =>
                        <a href={"/cards/" + rowData.id} target="_blank">{rowData.name}</a>
                    }></Column>
                    <Column field="type" header="Type"></Column>
                    <Column field="description" header="Description"></Column>
                    <Column header="Image" body={(rowData:any) =>
                        <img src={rowData.image} alt={rowData.name} width={100} height={150}/>
                    }/>
                    <Column header="Actions" body={(rowData:any) =>
                        <div className="admin-actions">
                            <Button label="Edit Card" onClick={() => EditCard(rowData)} />
                            <Button label="Delete" onClick={() => DeleteCard(rowData)} />
                        </div>
                    }/>
                </DataTable>
            </div>
            
            {//popup
            }
            <Dialog header="Create Card" visible={visible} style={{ width: '50vw' }} onHide={() => {setCreateThisCard({} as Card); setVisible(false)}}>
                <div className="admin-create-card">
                    <div className="admin-create-card-details">
                        <InputText placeholder="Name" value={createThisCard.name}  onChange={(e) => setCreateThisCard({...createThisCard, name: e.target.value})}/>
                        <br/>
                        <Dropdown value={createThisCard.type} options={["monster", "spell", "trap"]} onChange={(e) => setCreateThisCard({...createThisCard, type: e.value})} placeholder="Select a Type" />
                        <br/>
                        <InputTextarea rows={3} placeholder="Description" value={createThisCard.description} onChange={(e) => setCreateThisCard({...createThisCard, description: e.target.value})}/>
                        <br/>
                        <InputText placeholder="Image URL" value={createThisCard.image} onChange={(e) => setCreateThisCard({...createThisCard, image: e.target.value})}/>
                        <br/>
                        <img src={createThisCard.image} alt={createThisCard.name} width={100} height={150}/>
                    </div>
                    <div className="admin-create-card-buttons">
                        <Button label={editing ? "Update" : "Create"} onClick={async () => {
                            if(!createThisCard.name || !createThisCard.type || !createThisCard.description || !createThisCard.image){
                                alert("Please fill all fields");
                                return;
                            }
                            if(editing){
                                let res = await updateCard(createThisCard);
                                if(res.success){
                                    setCards(cards.map(c => c.id === createThisCard.id ? createThisCard : c));

                                }
                            }else{
                                let res = await createCard(createThisCard);
                                if(res.success){
                                    createThisCard.id = res.id;
                                    setCards([...cards, createThisCard]);
                                }
                            }
                            setCreateThisCard({} as Card); setVisible(false)
                        }} />
                        <Button label="Cancel" onClick={() => {setCreateThisCard({} as Card); setVisible(false)}} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}