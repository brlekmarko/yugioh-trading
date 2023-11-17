import { useEffect, useState } from "react";
import { User } from "../../interfaces/user";
import { deleteUser, getUser, getUserByUsername, logoutUser } from "../../apiCalls/userApi";
import { Button } from "primereact/button";
import { getAllCards, getCardsForUser } from "../../apiCalls/cardsApi";
import { Card, CardFromOffer } from "../../interfaces/card";
import { InputText } from "primereact/inputtext";
import { useParams } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TradeOfferWithCards } from "../../interfaces/trade_offer";
import { deleteTradeOffer, getTradeOffersForUser } from "../../apiCalls/tradeApi";

export default function ProfilePage(){

    let [user, setUser] = useState<User>();
    let [myUser, setMyUser] = useState<User>();
    let [allCards, setAllCards] = useState<Card[]>();
    let [userCards, setUserCards] = useState<Card[]>();
    let [searchUserCards, setSearchUserCards] = useState<string>("");
    let [searchMissingCards, setSearchMissingCards] = useState<string>("");
    let [tradeOffers, setTradeOffers] = useState<TradeOfferWithCards[]>();
    let { username } = useParams();

    async function DeleteUser(username: string|undefined){
        if(!username){
            return;
        }
        
        let res = await deleteUser(username);

        setUser(undefined);
        // if we delete our own user, logout
        // if admin deletes user, keep logged in
        if(myUser?.username === username) await logoutUser();
        window.location.href = "/";
    }

    async function fetchUserCards(username: string){
        let data = await getCardsForUser(username);
        if(data.success){
            setUserCards(data.cards);
        }
    }

    async function fetchTradeOffers(user: User){
        let res = await getTradeOffersForUser(user?.username);
        if (res.success) {
            setTradeOffers(res.tradeOffers);
            return res.tradeOffers;
        }
        setTradeOffers([]);
        return [];
    }

    async function fetchAllCards(){
        let data = await getAllCards();
        if(data.success){
            setAllCards(data.cards);
        }
    }

    function updateSearchUserCards(e: any){
        setSearchUserCards(e.target.value);
    }

    function updateSearchMissingCards(e: any){
        setSearchMissingCards(e.target.value);
    }

    async function DeleteTradeOffer(offer:TradeOfferWithCards){
        
        if(!myUser || (!myUser.admin && myUser.username !== offer.username)){
            alert("You must be an admin to delete other users' trade offers");
            return;
        }

        let res = await deleteTradeOffer(offer.id);
        if(res.success){
            setTradeOffers(tradeOffers?.filter(o => o.id !== offer.id));
            return;
        }
        alert("Failed to delete trade offer");
    }

    useEffect(() => {
        async function fetchUser() {
            if(!username){
                setUser(undefined);
                return;
            }
            const res : any = await getUserByUsername(username);
            if(res.success){
                setUser(res.user);
                await fetchUserCards(res.user.username);
                await fetchAllCards();
                await fetchTradeOffers(res.user);
                return;
            }
            setUser(undefined);
        }
        async function fetchMyUser() {
            const res : any = await getUser();
            if(res.success){
                setMyUser(res.user);
                return;
            }
            setMyUser(undefined);
        }

        fetchUser();
        fetchMyUser();
    },[]);

    return (
        <div className="ProfilePage">
            {user ? 
            <>
                <h1>Profile</h1>
                <p>Username: {user.username}</p>
                <p>First Name: {user.first_name}</p>
                <p>Last Name: {user.last_name}</p>
                <p>Admin: {user.admin ? "Yes" : "No"}</p>
                {(myUser?.admin || myUser?.username === user.username) &&
                    <Button label="Delete Account" onClick={() => DeleteUser(user?.username)} />
                }

                <hr/>

                <div className="user-trade-offers">
                    <h1>Trade Offers</h1>
                    <DataTable value={tradeOffers?.sort((a,b) => new Date(b.last_edit).getTime() - new Date(a.last_edit).getTime())} showGridlines>

                    <Column header="Username" body={(rowData:TradeOfferWithCards) =>
                        <a href={"/profile/" + rowData.username} target="_blank">{rowData.username}</a>
                    }></Column>

                    <Column header="Offering" body={(rowData:TradeOfferWithCards) =>
                        <div className="trade-offer-cards">
                            {rowData.offering.map((card:CardFromOffer) => 
                                <img src={card.image} alt={card.name} width={100} height={150}/>
                            )}
                        </div>
                    }></Column>

                    <Column header="Wanting" body={(rowData:any) =>
                        <div className="trade-offer-cards">
                            {rowData.wanting.map((card:Card) => 
                                <img src={card.image} alt={card.name} width={100} height={150}/>
                            )}
                        </div>
                    }></Column>

                    <Column header="Last Edit" body={(rowData:any) =>
                        <p>{new Date(rowData.last_edit).toLocaleString()}</p>
                    }></Column>

                    <Column header="Actions" body={(rowData:any) =>
                        <div className="trade-offer-actions">
                            {(myUser && (myUser.admin || myUser.username === rowData.username))
                            && <Button label="Delete" onClick={() => DeleteTradeOffer(rowData)} />}
                        </div>
                    }></Column>
                </DataTable>
                </div>

                <hr/>

                <div className="user-cards">
                    <h1>Owned Cards</h1>
                    <div style={{marginBottom: "10px"}}>
                        <InputText placeholder="Search" value={searchUserCards} onChange={updateSearchUserCards}/>
                    </div>
                    {userCards?.filter(card => card.name.toLowerCase().includes(searchUserCards.toLowerCase())
                    ).map(card => {
                        return (
                        <>
                            <a href={"/card/" + card.id}><img src={card.image} alt={card.name} width={200} height={300}/></a>
                        </>
                        )
                    })}
                </div>
                <hr/>
                <div className="missing-cards">
                    <h1>Missing cards</h1>
                    <div style={{marginBottom: "10px"}}>
                        <InputText placeholder="Search" value={searchMissingCards} onChange={updateSearchMissingCards}/>
                    </div>
                    {allCards?.filter(card => !userCards?.includes(card) && card.name.toLowerCase().includes(searchMissingCards.toLowerCase())
                    ).map(card => {
                        return (
                        <>
                            <a href={"/card/" + card.id}><img src={card.image} alt={card.name} width={200} height={300}/></a>
                        </>
                        )
                    })}
                </div>
            </> 
            : <h1>Not allowed</h1>}
        </div>
    );
}