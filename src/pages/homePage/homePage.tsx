import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { getAllCards, getCardsForUser, getTimeOnServer, openPack } from "../../apiCalls/cardsApi";
import { User } from "../../interfaces/user";
import { getUser } from "../../apiCalls/userApi";
import { useNavigate } from "react-router-dom";
import { acceptTradeOffer, createTradeOffer, deleteTradeOffer, getAllTradeOffers } from "../../apiCalls/tradeApi";
import { TradeOfferWithCards } from "../../interfaces/trade_offer";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card, CardFromOffer } from "../../interfaces/card";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import './homePage.css';

export default function HomePage() {

    const [user, setUser] = useState<User>();
    const [remainingTime, setRemainingTime] = useState<string>(""); // [hours, minutes, seconds]
    const [tradeOffers, setTradeOffers] = useState<TradeOfferWithCards[]>();
    const [createTradeVisible, setCreateTradeVisible] = useState<boolean>(false);
    const [createdTradeOffer, setCreatedTradeOffer] = useState<TradeOfferWithCards>({
        id: 0,
        username: "",
        offering: [],
        wanting: [],
        last_edit: "",
    });

    const [myCards, setMyCards] = useState<Card[]>([]); // cards that the user has, used when creating trade offer
    const [allCards, setAllCards] = useState<Card[]>([]); // all cards in the game, used when creating trade offer
    const navigate = useNavigate();

    const [newCards, setNewCards] = useState<Card[]>([]); // cards that the user got from opening a pack, used to show the user what cards he got
    const [newCardsVisible, setNewCardsVisible] = useState<boolean>(false); // used to open the dialog that shows the user what cards he got
    const [visibleCards, setVisibleCards] = useState<boolean[]>([]); // which cards have been clicked on, used to show the user the front of the card

    async function OpenPack() {
        if(!user){
            navigate('/login');
            return;
        }
        // check if 12 hours have passed
        let timeServer = await fetchTimeOnServer();
        let time = new Date(timeServer);
        let lastOpened = new Date(user.last_pack_opening);
        let diff = time.getTime() - lastOpened.getTime();
        if(diff < 12 * 60 * 60 * 1000){
            alert("You can only open a pack every 12 hours");
            return;
        }

        let res = await openPack();
        if (res.success) {
            setNewCards(res.cards);
            setNewCardsVisible(true);
            setVisibleCards(new Array(res.cards.length).fill(false));
        }
    }

    async function fetchTimeOnServer() {
        let res = await getTimeOnServer();
        return res.time;
    }

    async function fetchUser() {
        let res = await getUser();
        if (res.success) {
            setUser(res.user);
            return res.user;
        }
    }

    async function fetchTradeOffers(){
        let res = await getAllTradeOffers();
        if (res.success) {
            setTradeOffers(res.tradeOffers);
            return res.tradeOffers;
        }
    }

    async function fetchMyCards(user:User){
        if(!user){
            setMyCards([]);
            return;
        }
        let res = await getCardsForUser(user?.username);
        if(res.success){
            setMyCards(res.cards);
            return res.cards;
        }
    }

    async function fetchAllCards(){
        let res = await getAllCards();
        if(res.success){
            setAllCards(res.cards);
            return res.cards;
        }
    }

    function createTradeOfferClick(){
        if(!user){
            navigate('/login');
            return;
        }
        setCreateTradeVisible(true);
    }

    function closeCreateTradeOffer(){
        setCreateTradeVisible(false);
        setCreatedTradeOffer({
            id: 0,
            username: "",
            offering: [],
            wanting: [],
            last_edit: "",
        });
    }

    async function AcceptTradeOffer(offer:TradeOfferWithCards){

        if(!user){
            alert("You must be logged in to accept trade offers");
            return;
        }

        // first check so user is not accepting his own trade offer
        if(offer.username === user?.username){
            alert("You cannot accept your own trade offer");
            return;
        }
        // then check so user has all the cards that the trade offer wants
        let resCards = await getCardsForUser(user?.username);
        if(!resCards.success){
            alert("Failed to get user cards");
            return;
        }
        let userCards : Card[] = resCards.cards;
        let userCardIds = userCards.map(c => c.id);
        let tradeOfferCardIds = offer.wanting.map(c => c.id_card);
        let missingCards : string[] = [];
        for (let i = 0; i < tradeOfferCardIds.length; i++) {
            if(!userCardIds.includes(tradeOfferCardIds[i])){
                missingCards.push(offer.wanting[i].name);
            }
            else{
                // remove card from userCardIds, so we can check if user has multiple of the same card
                userCardIds = userCardIds.filter(id => id !== tradeOfferCardIds[i]);
            }
        }
        if(missingCards.length > 0){
            alert("You are missing the following cards: " + missingCards.join(", "));
            return;
        }

        // if we get here, we are ready to accept the trade offer
        let res = await acceptTradeOffer(offer.id);
        if(res.success){
            // we did the trade, need to update trade offers, set them to what we got back from the server
            setTradeOffers(res.tradeOffers);
            return;
        }
        alert("Failed to accept trade offer");
    }

    async function DeleteTradeOffer(offer:TradeOfferWithCards){
        
        if(!user?.admin){
            alert("You must be an admin to delete trade offers");
            return;
        }

        let res = await deleteTradeOffer(offer.id);
        if(res.success){
            setTradeOffers(tradeOffers?.filter(o => o.id !== offer.id));
            return;
        }
        alert("Failed to delete trade offer");
    }

    async function submitTradeOffer(){
        let res = await createTradeOffer(createdTradeOffer);
        if(res.success){
            setTradeOffers(res.tradeOffers);
            closeCreateTradeOffer();
            return;
        }
        alert("Failed to create trade offer");
    }

    const cardTemplate = (rowData:any) => {
        return (
        <div className="multiselect-row">
            <img src={rowData.image} alt={rowData.name} width={50} height={75}/>
            <h1>{rowData.name}</h1>
        </div>
        );
    }

    useEffect(() => {
        // first fetch time on server
        // then fetch user
        // then set interval that updates remaining time
        async function fetchAll() {
            let timeServer = await fetchTimeOnServer();
            let user = await fetchUser();
            await fetchMyCards(user);
            await fetchAllCards();
            await fetchTradeOffers();
            let lastOpened = new Date(user.last_pack_opening);

            // get difference between our time and time on server
            let timeZoneDiff = new Date().getTime() - new Date(timeServer).getTime();

            let timeOfNextOpening = new Date(lastOpened.getTime() + 12 * 60 * 60 * 1000 + timeZoneDiff);
            
            let interval = setInterval(() => {
                let timeNow = new Date();
                let diff = timeOfNextOpening.getTime() - timeNow.getTime();
                if(diff < 0){
                    setRemainingTime("Ready to open");
                    return;
                }
                let hours = Math.floor(diff / (1000 * 60 * 60)) + "";
                let minutes = Math.floor((diff / (1000 * 60)) % 60) + "";
                let seconds = Math.floor((diff / 1000) % 60) + "";
                if(hours.length === 1) hours = "0" + hours;
                if(minutes.length === 1) minutes = "0" + minutes;
                if(seconds.length === 1) seconds = "0" + seconds;
                setRemainingTime(hours + ":" + minutes + ":" + seconds);
            }, 500);

            return () => clearInterval(interval);
        }
        fetchAll();
    }, []);


    return (
        <div className="HomePage">
            <div className="pack-opening">
                <Button label="Open pack" onClick={OpenPack} disabled={remainingTime !== "Ready to open"} />
                {remainingTime && <p>Time until next pack opening: {remainingTime}</p>}
            </div>
            <div className="trade-offers">
                <h1>Trade Offers</h1>
                <Button label="Create Trade Offer" onClick={createTradeOfferClick} disabled={!user} style={{marginBottom: "20px"}}/>

                <DataTable value={tradeOffers?.sort((a,b) => new Date(b.last_edit).getTime() - new Date(a.last_edit).getTime())} showGridlines>

                    <Column header="Username" body={(rowData:TradeOfferWithCards) =>
                        <a href={"/profile/" + rowData.username} target="_blank" rel="noreferrer">{rowData.username}</a>
                    }></Column>

                    <Column header="Offering" body={(rowData:TradeOfferWithCards) =>
                        <div className="trade-offer-cards">
                            {rowData.offering.map((card:CardFromOffer) => 
                                <a href={"/card/" + card.id_card} target="_blank" rel="noreferrer">
                                    <img src={card.image} alt={card.name} width={100} height={150}/>
                                </a>
                            )}
                        </div>
                    }></Column>

                    <Column header="Wanting" body={(rowData:any) =>
                        <div className="trade-offer-cards">
                            {rowData.wanting.map((card:CardFromOffer) => 
                                <a href={"/card/" + card.id_card} target="_blank" rel="noreferrer">
                                    <img src={card.image} alt={card.name} width={100} height={150}/>
                                </a>
                            )}
                        </div>
                    }></Column>

                    <Column header="Last Edit" body={(rowData:any) =>
                        <p>{new Date(rowData.last_edit).toLocaleString()}</p>
                    }></Column>

                    <Column header="Actions" body={(rowData:any) =>
                        <div className="trade-offer-actions">
                            {rowData.username !== user?.username &&
                                <Button label="Accept" onClick={() => AcceptTradeOffer(rowData)} disabled={!user} />
                            }
                            {user?.admin && <Button label="Delete" onClick={() => DeleteTradeOffer(rowData)} />}
                        </div>
                    }></Column>
                </DataTable>

            </div>
            <Dialog header="Create Trade Offer" visible={createTradeVisible} onHide={closeCreateTradeOffer}>
                <div className="create-trade-content">
                    <div className="left-side">
                        <h1>Offering</h1>
                        <MultiSelect
                            value={createdTradeOffer?.offering}
                            options={myCards.map((c, i) => ({ ...c, id_card: c.id, i:i })).sort((a,b) => a.id - b.id)} //added i so multiple cards with same id can be selected
                            optionLabel="name"
                            filter
                            style={{width: "500px", marginBottom: "20px"}}
                            placeholder="Select offering cards"
                            itemTemplate={cardTemplate}
                            onChange={(e) =>
                                setCreatedTradeOffer((prevTradeOffer) => ({
                                    ...prevTradeOffer,
                                    offering: e.value,
                                }))
                            }
                        />
                        <div className="selected-images">
                            {createdTradeOffer?.offering.map((card:CardFromOffer) => 
                                <img src={card.image} alt={card.name} width={100} height={150}/>
                            )}
                        </div>
                    </div>
                    
                    <div className="right-side">
                        <h1>Wanting</h1>
                        <MultiSelect
                            value={createdTradeOffer?.wanting}
                            options={allCards.map((c, i) => ({ ...c, id_card: c.id, i: i})).sort((a,b) => a.id - b.id)} //added i so multiple cards with same id can be selected
                            optionLabel="name"
                            filter
                            style={{width: "500px", marginBottom: "20px"}}
                            placeholder="Select wanting cards"
                            itemTemplate={cardTemplate}
                            onChange={(e) =>
                                setCreatedTradeOffer((prevTradeOffer) => ({
                                    ...prevTradeOffer,
                                    wanting: e.value,
                                }))
                            }
                        />
                        <div className="selected-images">
                            {createdTradeOffer?.wanting.map((card:CardFromOffer) => 
                                <img src={card.image} alt={card.name} width={100} height={150}/>
                            )}
                        </div>
                    </div>
                </div>
                <div className="create-trade-buttons">
                    <Button label="Create" onClick={submitTradeOffer} />
                </div>
            </Dialog>

            <Dialog style={{width:"600px"}} className="transparent-dialog" visible={newCardsVisible} onHide={() => {
                setNewCardsVisible(false)
                setNewCards([]);
                setVisibleCards([]);
                window.location.reload();
            }
            }>
                <div className="new-cards-content">
                    {//first display the back of the cards, then on click display the front}
                    }

                    {newCards.map((card:Card, i) => 
                        <div>
                            <img className={visibleCards[i] ? "animated-card-image" : ""}
                            src={visibleCards[i] ? card.image : "/back.jpg"} 
                            alt={card.name} width={200} height={300} 
                            onClick={() => {
                                let newVisibleCards = [...visibleCards];
                                newVisibleCards[i] = true;
                                setVisibleCards(newVisibleCards);
                            }}/>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
}