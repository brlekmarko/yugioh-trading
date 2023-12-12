import { useState } from "react";
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { registerUser } from "../../apiCalls/userApi";
import { Password } from 'primereact/password';
import './registerPage.css';
import { prefix } from "../..";

export default function RegisterPage() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confimPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    async function register() {
        
        if(username.length === 0 || password.length === 0 || confimPassword.length === 0 || firstName.length === 0 || lastName.length === 0){
            alert("Please fill in all fields");
            return;
        }

        if(password !== confimPassword){
            alert("Passwords do not match");
            return;
        }

        try{
            let res : any = await registerUser(username, password, firstName, lastName);
            window.location.href = prefix;
            return;
        }
        catch(err){
            alert("Register failed");
        }
    }

    return (
        <div className="RegisterPage">
            <div className="register-form">

                <h1>Register here</h1>

                <div className="register-form-inputs">
                
                    <div className="register-username">
                        <label>Username</label>
                        <InputText value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
                    </div>
                    
                    <div className="register-password">
                        <label>Password</label>
                        <Password value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" feedback={false}/>
                    </div>

                    <div className="register-password">
                        <label>Confirm Password</label>
                        <Password value={confimPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" feedback={false}/>
                    </div>

                    <div className="register-name">
                        <label>First Name</label>
                        <InputText value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
                    </div>

                    <div className="register-name">
                        <label>Last Name</label>
                        <InputText value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
                    </div>

                </div>
                <Button onClick={register}>Register</Button>
            </div>
            <p>Already have an account? <a href={prefix + "/login"}>Login here</a></p>
        </div>
    );
}