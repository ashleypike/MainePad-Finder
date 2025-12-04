import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("M");
  const [userType, setUserType] = useState("Renter")
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password != confirmPassword) {
      setError("Passwords do not match")
      return;
    }

    try {
      const response = await fetch ("https://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, username, password, displayName, phoneNumber, birthDate, gender, userType}),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/login");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      setError("Network error");
    }
  }

  return (
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{color: "red"}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div>
          <label>Username:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>

        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div>
          <label>Confirm Password:</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>

        <div>
          <label>Phone Number:</label>
          <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
        </div>

        <div>
          <label>Birth Date:</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required /> 
        </div>

        <div>
          <label>Display Name:</label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>

        <div>
          <label>Gender:</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} required >
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="X">Other</option>
            <option value="?">Prefer not to say</option>
          </select>
        </div>

        <br />
        <div>
          <p>Select user type:</p>
          <label>
            <input type="radio" name="userType" value="Renter" checked={userType === "Renter"} onChange={(e) => setUserType(e.target.value)} />
            Renter
          </label>
           <br />
          <label>
            <input type="radio" name="userType" value="Landlord" checked={userType === "Landlord"} onChange={(e) => setUserType(e.target.value)} />
            Landlord
          </label>
        </div>

        <button type="submit">
          Sign Up
        </button>
      </form>
    </div>
  );
}
