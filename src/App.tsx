import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import './App.css';
import { User } from './interfaces/user';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/homePage/homePage';
import LoginPage from './pages/loginPage/loginPage';
import NotFoundPage from './pages/notFoundPage/notFoundPage';
import { getUser, logoutUser } from './apiCalls/userApi';
import RegisterPage from './pages/registerPage/registerPage';
import AdminPage from './pages/adminPage/adminPage';
import ProfilePage from './pages/profilePage/profilePage';
import CardPage from './pages/cardPage/cardPage';
import {prefix} from './index';

function App() {

  const [user, setUser] = useState<User>();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      try{
        const res : any = await getUser();
        setUser(res.user);
        return;
      }
      catch(err){
        setUser(undefined);
      }
    }
    fetchUser();
  },[]);

  async function login() {
    // redirect to login page
    navigate('/login');
  }

  async function logout() {
    await logoutUser();
    setUser(undefined);
    window.location.href = prefix
  }


  return (
    <div className="App">
      <header className="App-header">
        {user ? <>
          <span className="left-align-header">
            <a className="header-link" href={prefix + "/"}>Home</a>
            {user.admin && <a className="header-link" href={prefix + "/admin"}>Admin</a>}
            <a className="header-link" href={prefix + "/profile/" + user.username}>Profile</a>
          </span>
          <span className="right-align-header">
            {user.first_name + ' ' + user.last_name}
            <Button onClick={logout}>Logout</Button>

          </span>
          
        </> : <>
          <span className="left-align-header">
            <a className="header-link" href={prefix + "/"}>Home</a>
          </span>
          <span className="right-align-header">
          <Button onClick={login}>Login</Button>
          </span>
        </>}
      </header>

    <Routes>
        <Route
          path={"/"}
          element={<HomePage/>}
        />
        <Route
            path={"/login"}
            element={<LoginPage/>}
        />
        <Route
            path={"/register"}
            element={<RegisterPage/>}
        />
        <Route
            path={"/profile/:username"}
            element={<ProfilePage />}
        />
        <Route
            path={"/admin"}
            element={<AdminPage />}
        />
        <Route
            path={"/card/:id"}
            element={<CardPage />}
        />
        <Route
            path="*"
            element={<NotFoundPage />}
        />
    </Routes>

    </div>
  );
}

export default App;
