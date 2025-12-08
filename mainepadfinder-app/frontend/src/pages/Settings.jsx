import { useEffect, useState } from "react";

export default function Settings() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [distanceMax, setDistanceMax] = useState("");
  const [genderPreferred, setGenderPreferred] = useState("?");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("https://localhost:5000/api/settings", {
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load settings");
        return;
      }

      setRole(data.role || "");

      if (data.user) {
        setEmail(data.user.EMAIL || "");
        setPhoneNumber(data.user.PHONE_NUMBER || "");
        setDisplayName(data.user.DISPLAY_NAME || "");
      }

      if (data.role === "Renter" && data.renterSettings) {
        setDistanceMax(data.renterSettings.DISTANCE_MAX ?? "");
        setGenderPreferred(data.renterSettings.GENDER_PREFERRED ?? "?");
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const payload = {
        email,
        phoneNumber,
        displayName,
      };

      if (role === "Renter") {
        payload.distanceMax = distanceMax;
        payload.genderPreferred = genderPreferred;
      }

      const res = await fetch("https://localhost:5000/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update settings");
        return;
      }

      setMessage("Settings saved.");
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h1>Settings</h1>
      <p>Role: {role || "Unknown"}</p>

      {error && <p>{error}</p>}
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Display Name: </label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>

        <div>
          <label>Email: </label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label>Phone Number: </label>
          <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>

        {role === "Renter" && (
          <>
            <div>
              <label>Max Distance: </label>
              <input
                type="number"
                value={distanceMax}
                onChange={(e) => setDistanceMax(e.target.value)}
              />
            </div>

            <div>
              <label>Preferred Gender: </label>
              <select
                value={genderPreferred}
                onChange={(e) => setGenderPreferred(e.target.value)}
              >
                <option value="?">No preference</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="X">Other</option>
              </select>
            </div>
          </>
        )}

        <button type="submit">Save</button>
      </form>
    </div>
  );
}
