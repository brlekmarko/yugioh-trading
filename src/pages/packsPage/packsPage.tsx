import { useEffect, useState } from "react";
import { User } from "../../interfaces/user";
import "./packsPage.css";
import { getAllPacks, openPack } from "../../apiCalls/packsApi";
import { getUser } from "../../apiCalls/userApi";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { Card } from "../../interfaces/card";
import { Dialog } from "primereact/dialog";
import { Pack } from "../../interfaces/pack";
export default function PacksPage(){
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    const [packs, setPacks] = useState<Pack[]>([]);

    const [newCards, setNewCards] = useState<Card[]>([]); // cards that the user got from opening a pack, used to show the user what cards he got
    const [newCardsVisible, setNewCardsVisible] = useState<boolean>(false); // used to open the dialog that shows the user what cards he got
    const [visibleCards, setVisibleCards] = useState<boolean[]>([]); // which cards have been clicked on, used to show the user the front of the card

    async function fetchPacks(){
        let res : any = await getAllPacks();
        setPacks(res.packs);
    }

    async function fetchUser(){
        let fetchedUser = await getUser();
        setUser(fetchedUser.user);
        return fetchedUser.user;
    }

    async function OpenPack(id : number) {
        if(!user){
            navigate('/login');
            return;
        }
        try{
            let res = await openPack(id);
            setUser({...user, coins: res.coins})
            setNewCards(res.cards);
            setNewCardsVisible(true);
            setVisibleCards(new Array(res.cards.length).fill(false));
        }
        catch(e){
            console.log(e);
        }
        
    }

    useEffect(() => {
        fetchPacks();
        async function checkIfLoggedIn(){
            let fetchedUser = await fetchUser();
            if(!fetchedUser){
                navigate("/login");
            }
        }
        checkIfLoggedIn();
    }, []);

    return(
        <div>
            <h1>Balance: {user ? user.coins + "" : 0}</h1>
            <div className="packs-container">
                {packs ?
                packs.map((pack, index) => {
                    return(
                        <div key={index} className="pack">
                            <h3>{pack.name}</h3>
                            <img src={pack.image} alt={pack.name} title={pack.description} width={100} height={150}/>
                            <Button label={pack.price + ""} onClick={() => OpenPack(pack.id)}/>
                        </div>
                    )
                })
                : "Currently no packs are available"}
            </div>
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
    )
}

