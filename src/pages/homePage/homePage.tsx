import { Button } from "primereact/button";
import { useEffect, useState } from "react";
import { getTimeOnServer, openPack } from "../../apiCalls/cardsApi";
import { User } from "../../interfaces/user";
import { getUser } from "../../apiCalls/userApi";
import { useNavigate } from "react-router-dom";

export default function HomePage() {

    const [timeOnServer, setTimeOnServer] = useState<string>("");
    const [user, setUser] = useState<User>();
    const [remainingTime, setRemainingTime] = useState<string>(""); // [hours, minutes, seconds]
    const navigate = useNavigate();

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
            window.location.href = "/";
        }
    }

    async function fetchTimeOnServer() {
        let res = await getTimeOnServer();
        setTimeOnServer(res.time);
        return res.time;
    }

    async function fetchUser() {
        let res = await getUser();
        if (res.success) {
            setUser(res.user);
            return res.user;
        }
    }

    function createTradeOfferClick(){
        if(!user){
            navigate('/login');
            return;
        }
        console.log("create trade offer");
    }

    useEffect(() => {
        // first fetch time on server
        // then fetch user
        // then set interval that updates remaining time
        async function fetchAll() {
            let timeServer = await fetchTimeOnServer();
            let user = await fetchUser();
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
                <Button label="Create Trade Offer" onClick={createTradeOfferClick} disabled={!user} />
                <p>Coming soon</p>
            </div>
        </div>
    );
}