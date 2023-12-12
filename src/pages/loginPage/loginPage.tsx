import { useState } from "react";
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { loginUser } from "../../apiCalls/userApi";
import { Password } from 'primereact/password';
import './loginPage.css';
import { prefix } from "../..";

export default function LoginPage() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    async function login() {

        if(username.length === 0 || password.length === 0){
            alert("Please fill in all fields");
            return;
        }

        try{
            let res : any = await loginUser(username, password);
            window.location.href = prefix;
            return;
        }
        catch(err){
            alert("Login failed");
        }
    }

    return (
        <div className="LoginPage">
            <div className="login-form">

                <h1>Login here</h1>

                <div className="login-form-inputs">
                    <div className="login-username">
                        <label>Username</label>
                        <InputText value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
                    </div>
                    
                    <div className="login-password">
                        <label>Password</label>
                        <Password value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" feedback={false}/>
                    </div>
                </div>

                <Button onClick={login}>Login</Button>
            </div>
            <p>Don't have an account? <a href={prefix + "/register"}>Register here</a></p>
        </div>
    );
}