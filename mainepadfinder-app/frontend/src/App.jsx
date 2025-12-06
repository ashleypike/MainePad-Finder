import { Routes, Route, Link } from "react-router-dom";
import { useState } from "react";

import Home from "./pages/Home.jsx";
import Signup from "./pages/SignUp.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";
import Matching from "./pages/Matching.jsx";
import Listing from "./pages/Listing.jsx";
import Properties from "./pages/Properties.jsx";
import ManageProperties from "./pages/ManageProperties.jsx";
import AddProperty from "./pages/AddProperty.jsx";
import Messages from "./pages/Messages.jsx";


function App() {
  const [data, setData] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#FFFFFF", // page background is white
      }}
    >
      {/* HEADER */}
      <header
        style={{
          borderBottom: "1px solid #2563EB", // darker blue border
          backgroundColor: "#60A5FA",        // medium blue header bar
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            padding: "0.75rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1.5rem",
          }}
        >
          {/* Left: logo + app name */}
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              textDecoration: "none",
            }}
          >
            {/* Logo file in frontend/public/MainePadNewLogo.png */}
            <img
              src="/MainePadNewLogo.png" //this is our logo we created 
              alt="MainePadFinder logo"
              style={{ width: 42, height: 42, borderRadius: "999px" }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: "1.1rem",
                letterSpacing: "0.03em",
                color: "#FFFFFF", // white text 
              }}
            >
              MainePadFinder
            </span>
          </Link>

          {/* Right: navigation links */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              fontSize: "0.9rem",
            }}
          >
            <Link
              to="/matching"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Matching
            </Link>
            <Link
              to="/properties"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Properties
            </Link>
            <Link
              to="/manage-properties"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Manage Properties
            </Link>
            <Link
              to="/add-property"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Add Property
            </Link>
            <Link
              to="/profile"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Profile
            </Link>
              <Link
                to="/messages"
                style={{ textDecoration: "none", color: "#FFFFFF" }}
              >
                Messages
              </Link>
            <Link
              to="/settings"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Settings
            </Link>
            <Link
              to="/login"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              style={{ textDecoration: "none", color: "#FFFFFF" }}
            >
              Signup
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main
        style={{
          width: "100%",
          maxWidth: "1200px", // or remove this line if you want true full-bleed
          margin: "0 auto",
          padding: "1.5rem",
  }}
>

      
        {data && (
          <p style={{ marginBottom: "1rem", color: "#4B5563" }}>
            {data}
          </p>
        )}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/matching" element={<Matching />} />
          <Route path="/listing/:id" element={<Listing />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/manage-properties" element={<ManageProperties />} />
          <Route path="/add-property" element={<AddProperty />} />
          <Route path="/messages" element={<Messages />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;