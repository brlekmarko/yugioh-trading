import { useParams } from "react-router-dom";
import { Card } from "../../interfaces/card";
import { useState, useEffect } from "react";
import { getCard } from "../../apiCalls/cardsApi";
import './cardPage.css';

export default function CardPage(){

    const [card, setCard] = useState<Card>();
    const { id } = useParams();
    const appearSpeed = 0.175;

    async function fetchCard(){
        
        if(!id){
            setCard(undefined);
            return;
        }

        try{
            let res = await getCard(id);
            setCard(res.card);
            return;
        }
        catch(err){
            setCard(undefined);
            alert("Failed to fetch card");
        }
    }

    useEffect(() => {
        fetchCard();
    }
    ,[]);


    return (
        <div className="card-page">
            <div className="card-page-content">
                <img src={card?.image} alt={card?.name} width={400} height={600} />
                <div className="right-side">
                <div className="talking-bubble">
                    <span className="animated-word" style={{ animationDelay: `${0 * appearSpeed}s` }}>This is </span>
                    <span className="talking-card-name animated-word" style={{ animationDelay: `${1 * appearSpeed}s` }}>{card?.name}</span>
                    <span className="animated-word" style={{ animationDelay: `${2 * appearSpeed}s` }}>! It's a </span>
                    <span className="talking-card-type animated-word" style={{ animationDelay: `${3 * appearSpeed}s`}}>{card?.type}</span> 
                    <span className="animated-word" style={{ animationDelay: `${4 * appearSpeed}s` }}> card. </span>
                    {card?.description.split(' ').map((word, i) => (
                        <span className="animated-word" style={{ animationDelay: `${(i+5) * 0.125}s` }}>{word} </span>
                    ))}
                </div>

                    <div className="yugi-talk">
                        <img src="/yugi.png" alt="yugi" className="yugi-talk-img" width={400} height={600} />
                    </div>
                </div>
                
            </div>
        </div>
    );
}