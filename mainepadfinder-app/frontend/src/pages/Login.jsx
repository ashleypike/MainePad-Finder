// Author: Ashley Pike
// Enables a user to login using their username and password
// Receives session token from backend 
import { useState } from "react";
import { useSearchParams, useNavigate, replace } from "react-router-dom";
import { AuthProvider, useAuth } from "../App.jsx";

export default function Login() {
  const [params] = useSearchParams();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const redirectTo = params.get("redirect") ? decodeURIComponent(params.get("redirect")) : "/home";

  const handleSubmit = async (e) => {
    e.preventDefault();


    try {
      const response = await fetch ("https://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login();
        navigate(redirectTo, replace);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error");
    }
  }


  return (
    <div>
      <h1>Login Page</h1>
      {error && <p style={{color: "red"}}>{error}</p>}
      <form onSubmit={handleSubmit}>

        <div>
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button type="submit">
          Log in
        </button>
      </form>
    </div>
  );
}
