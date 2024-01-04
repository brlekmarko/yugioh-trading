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
import { createPack, deletePack, getAllPacks, updatePack } from "../../apiCalls/packsApi";
import { Pack } from "../../interfaces/pack";
import { InputNumber } from "primereact/inputnumber";

export default function AdminPage(){

    const [users, setUsers] = useState<User[]>([]);
    const [user, setUser] = useState<User>();
    const [searchUsers, setSearchUsers] = useState<string>("");
    const [cards, setCards] = useState<Card[]>([]);
    const [searchCards, setSearchCards] = useState<string>("");
    const [packs, setPacks] = useState<any[]>([]);
    //popup for creating/editing cards
    const [visible, setVisible] = useState<boolean>(false);
    const [createThisCard, setCreateThisCard] = useState<Card>({} as Card);
    const [editing, setEditing] = useState<boolean>(false);
    //popup for creating/editing packs
    const [createThisPack, setCreateThisPack] = useState<Pack>({} as Pack);
    const [editingPack, setEditingPack] = useState<boolean>(false);
    const [visiblePack, setVisiblePack] = useState<boolean>(false);


    async function fetchAllUsers(){
        try{
            let res = await getAllUsers();
            // remove current user from list
            let user = await getUser();
            user = user.user;
            setUsers(res.users.filter((u: User) => u.username !== user.username));
            return;
        }
        catch(err){
            setUsers([]);
            alert("Failed to fetch users");
        }
    }

    function updateSearchUsers(e: any){
        setSearchUsers(e.target.value);
    }

    function updateSearchCards(e: any){
        setSearchCards(e.target.value);
    }

    async function fetchAllCards(){
        try{
            let res = await getAllCards();
            setCards(res.cards);
            return;
        }
        catch(err){
            setCards([]);
            alert("Failed to fetch cards");
        }
    }

    async function fetchAllPacks(){
        try{
            let res = await getAllPacks();
            setPacks(res.packs);
            return;
        }
        catch(err){
            setCards([]);
            alert("Failed to fetch packs");
        }
    }

    async function fetchMyUser(){
        try{
            let res = await getUser();
            setUser(res.user);
            return;
        }
        catch(err){
            console.log(err);
        }
    }

    async function DeleteUser(username:string){
        await deleteUser(username);
        setUsers(users.filter(user => user.username !== username));
    }

    async function ToggleAdmin(user : User){
        try{
            user.admin = !user.admin;
            let res = await updateUser(user);
            setUsers(users.map(u => u.username === user.username ? user : u));
            return;
        }
        catch(err){
            alert("Failed to toggle admin");
        }
    }

    //cards
    async function DeleteCard(card:Card){
        await deleteCard(card);
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

    //packs
    async function DeletePack(id : number){
        await deletePack(id);
        setPacks(packs.filter(p => p.id !== id));
    }

    async function EditPack(pack:Pack){
        setCreateThisPack(pack);
        setEditingPack(true);
        setVisiblePack(true);
    }

    async function CreatePack(){
        setCreateThisPack({} as Pack);
        setEditingPack(false);
        setVisiblePack(true);
    }


    useEffect(() => {
        fetchAllUsers();
        fetchAllCards();
        fetchAllPacks();
        fetchMyUser();
    },[]);

    return (
        <>
            {user?.admin && 
            <div className="AdminPage">
                <div className="admin-users">
                    <h1>Users</h1>
                    <div style={{marginBottom: "10px"}}>
                        <InputText placeholder="Search" value={searchUsers} onChange={updateSearchUsers}/>
                    </div>
                    <DataTable value={users.filter(user => user.username.toLowerCase().includes(searchUsers.toLowerCase()))} scrollable scrollHeight="300px"
                        style={{border: "1px solid black"}}>
                    <Column header="Username" body={(rowData:any) =>
                            <a href={"/profile/" + rowData.username} target="_blank" rel="noreferrer">{rowData.username}</a>
                        }></Column>
                        <Column field="first_name" header="First Name"></Column>
                        <Column field="last_name" header="Last Name"></Column>
                        <Column field="coins" header="Coins"></Column>
                        <Column field="admin" header="Admin"></Column>
                        <Column header="Actions" body={(rowData:any) =>
                            <div className="admin-actions">
                                <Button label="Toggle Admin" onClick={() => ToggleAdmin(rowData)} />
                                <Button label="Delete" onClick={() => DeleteUser(rowData.username)} />
                            </div>
                        }/>
                    </DataTable>
                </div>
                
                <div className="admin-packs">
                    <h1>Packs</h1>
                    <Button label="Create Pack" onClick={CreatePack} />
                    <DataTable value={packs} scrollable scrollHeight="300px"
                        style={{border: "1px solid black"}}>
                        <Column field="name" header="Pack Name"></Column>
                        <Column field="description" header="Description"></Column>
                        <Column field="collection" header="Collection"></Column>
                        <Column field="type" header="Type"></Column>
                        <Column field="price" header="Price"></Column>
                        <Column header="Image" body={(rowData:any) =>
                            <img src={rowData.image} alt={rowData.name} width={100} height={150}/>
                        }/>
                        <Column header="Actions" body={(rowData:any) =>
                            <div className="admin-actions">
                                <Button label="Edit" onClick={() => EditPack(rowData)} />
                                <Button label="Delete" onClick={() => DeletePack(rowData.id)} />
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
                    <DataTable value={cards.filter(card => card.name.toLowerCase().includes(searchCards.toLowerCase())).sort((a,b) => b.id - a.id)}>
                        <Column header="Name" body={(rowData:any) =>
                            <a href={"/card/" + rowData.id} target="_blank" rel="noreferrer">{rowData.name}</a>
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
                                    try{
                                        let res = await updateCard(createThisCard);
                                        setCards(cards.map(c => c.id === createThisCard.id ? createThisCard : c));
                                    }
                                    catch(err){
                                        alert("Failed to update card");
                                    }

                                }else{
                                    try{
                                        let res = await createCard(createThisCard);
                                        createThisCard.id = res.id;
                                        setCards([...cards, createThisCard]);
                                    }
                                    catch(err){
                                        alert("Failed to create card");
                                    }
                                }
                                setCreateThisCard({} as Card); setVisible(false)
                            }} />
                            <Button label="Cancel" onClick={() => {setCreateThisCard({} as Card); setVisible(false)}} />
                        </div>
                    </div>
                </Dialog>

                <Dialog header="Create Pack" visible={visiblePack} style={{ width: '50vw' }} onHide={() => {setCreateThisPack({} as Pack); setVisiblePack(false)}}>
                    <div className="admin-create-card">
                        <div className="admin-create-card-details">
                            <InputText placeholder="Name" value={createThisPack.name}  onChange={(e) => setCreateThisPack({...createThisPack, name: e.target.value})}/>
                            <br/>
                            <InputTextarea rows={3} placeholder="Description" value={createThisPack.description} onChange={(e) => setCreateThisPack({...createThisPack, description: e.target.value})}/>
                            <br/>
                            <Dropdown value={createThisPack.type} options={["any", "monster", "spell", "trap"]} onChange={(e) => setCreateThisPack({...createThisPack, type: e.value})} placeholder="Select a Type" />
                            <br/>
                            <InputText placeholder="Collection" value={createThisPack.collection} onChange={(e) => setCreateThisPack({...createThisPack, collection: e.target.value})}/>
                            <br/>
                            <InputNumber placeholder="Price" value={createThisPack.price} onChange={(e) => setCreateThisPack({...createThisPack, price: e.value ?? 0})}/>
                            <br/>
                            <InputText placeholder="Image URL" value={createThisPack.image} onChange={(e) => setCreateThisPack({...createThisPack, image: e.target.value})}/>
                            <br/>
                            <img src={createThisPack.image} alt={createThisPack.name} width={100} height={150}/>
                        </div>
                        <div className="admin-create-card-buttons">
                            <Button label={editingPack ? "Update" : "Create"} onClick={async () => {
                                if(!createThisPack.name || !createThisPack.type || !createThisPack.description || !createThisPack.image){
                                    alert("Please fill all fields");
                                    return;
                                }
                                if(editingPack){
                                    try{
                                        let res = await updatePack(createThisPack);
                                        setPacks(packs.map(p => p.id === createThisPack.id ? createThisPack : p));
                                    }
                                    catch(err){
                                        alert("Failed to update pack");
                                    }

                                }else{
                                    try{
                                        let res = await createPack(createThisPack);
                                        createThisPack.id = res.id;
                                        setPacks([...packs, createThisPack]);
                                    }
                                    catch(err){
                                        alert("Failed to create pack");
                                    }
                                }
                                setCreateThisPack({} as Pack); setVisiblePack(false)
                            }} />
                            <Button label="Cancel" onClick={() => {setCreateThisPack({} as Pack); setVisiblePack(false)}} />
                        </div>
                    </div>
                </Dialog>
            </div>
            }
        </>
    );
}