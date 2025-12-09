// Author: Ashley Pike
// Handles page routing and protects certain routes from logged out users
import { Routes, Route, Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState, useContext, createContext, use,} from "react";

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
import Messages from "./pages/Messages.jsx";

const AuthContext = createContext(null);

export function useAuth(){
  return useContext(AuthContext);
}

// Handles authentication of users session
function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("https://localhost:5000/api/me", {
          method: "GET",
          credentials: "include",
       });

       if (response.ok) {
        setIsAuthenticated(true);
       } else {
        setIsAuthenticated(false);
       }
      } catch {
        setIsAuthenticated(false);
      }
      setLoading(false);
    }

    checkSession();
  },
[]);

  const login = async () => {
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await fetch("https://localhost:5000/api/logout", {
        method: "POST",
        credentials: "include",
    });
    setIsAuthenticated(false);
  };

  return (<AuthContext.Provider  value={{ loading, isAuthenticated, login, logout, }}> {children} </AuthContext.Provider>);
}

export {AuthProvider};

// Protects routes from logged-out users
// Redirects to log in on attempted access by logged-out user
function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) return <p>Loading...</p>;

  if (!isAuthenticated) {
    return (<Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />);
  }
  return children
}

function App() {
  const { isAuthenticated, logout } = useAuth();
  const [data, setData] = useState("");

  return (
    <>
      <p>{data}</p>

      <nav>
        <Link to="/">Home</Link> |
        <Link to="/properties">Properties</Link> |

        {isAuthenticated ? (
          <>
            <button onClick={logout} style={{ marginLeft: "10px" }}>Logout</button> |
            <Link to="/profile">Profile</Link> |
            <Link to="/settings">Settings</Link> |
            <Link to="/matching">Matching</Link> |
            <Link to="/manage-properties">Manage Properties</Link> |
            <Link to="/add-property">Add Property</Link> |
            <Link to="/messages">Messages</Link>
          </>
        ) : (
          <>
            <Link to="/signup">Signup</Link> |
            <Link to="/login">Login</Link> |
          </>
        )}

      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/matching" element={<ProtectedRoute><Matching /></ProtectedRoute>} />
        <Route path="/listing/:id" element={<Listing />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/manage-properties" element={<ProtectedRoute><ManageProperties /></ProtectedRoute>} />
        <Route path="/add-property" element={<ProtectedRoute><AddProperty /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default App;
