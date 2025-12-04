import { Routes, Route, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home.jsx"
import Signup from "./pages/SignUp.jsx"
import Login from "./pages/Login.jsx"
import Profile from "./pages/Profile.jsx"
import Settings from "./pages/Settings.jsx"
import Matching from "./pages/Matching.jsx"
import Listing from "./pages/Listing.jsx"
import Properties from "./pages/Properties.jsx"
import ManageProperties from "./pages/ManageProperties.jsx"
import AddProperty from "./pages/AddProperty.jsx"

function App() {
  const [data, setData] = useState("");

  return (
    <>
      <h1>Welcome To MainePad Finder</h1>
      <p>{data}</p>

      <nav>
        <Link to="/">Home</Link> |
        <Link to="/signup">Signup</Link> |
        <Link to="/login">Login</Link> |
        <Link to="/profile">Profile</Link> |
        <Link to="/settings">Settings</Link> |
        <Link to="/matching">Matching</Link> |
        <Link to="/listing">Listing</Link> |
        <Link to="/properties">Properties</Link> |
        <Link to="/manage-properties">Manage Properties</Link> |
        <Link to="/add-property">Add Property</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/listing" element={<Listing />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/manage-properties" element={<ManageProperties />} />
        <Route path="/add-property" element={<AddProperty />} />
      </Routes>
    </>
  );


}

export default App;
