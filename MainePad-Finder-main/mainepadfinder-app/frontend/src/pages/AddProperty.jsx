import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddProperty() {
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("ME");
  const [zipCode, setZipCode] = useState("");
  const [unitLabel, setUnitLabel] = useState("");
  const [rentCost, setRentCost] = useState("");
  const [sqft, setSqft] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [canRent, setCanRent] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("https://localhost:5000/api/properties", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street,
          city,
          stateCode,
          zipCode,
          unitLabel,
          rentCost,
          sqft,
          bedrooms,
          bathrooms,
          canRent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add property");
        return;
      }

      alert("Property created. ID = " + data.propertyId);
      navigate("/manage-properties");
    } catch (err) {
      console.error(err);
      setError("Network error");
    }
  };

  return (
    <div>
      <h1>Add Property</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>Street: </label>
          <input value={street} onChange={(e) => setStreet(e.target.value)} required />
        </div>

        <div>
          <label>City: </label>
          <input value={city} onChange={(e) => setCity(e.target.value)} required />
        </div>

        <div>
          <label>State Code: </label>
          <input
            value={stateCode}
            maxLength={2}
            onChange={(e) => setStateCode(e.target.value.toUpperCase())}
            required
          />
        </div>

        <div>
          <label>ZIP Code: </label>
          <input
            value={zipCode}
            maxLength={5}
            onChange={(e) => setZipCode(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Unit / Apt: </label>
          <input value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
        </div>

        <div>
          <label>Rent: </label>
          <input
            type="number"
            value={rentCost}
            onChange={(e) => setRentCost(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Square Feet: </label>
          <input
            type="number"
            value={sqft}
            onChange={(e) => setSqft(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Bedrooms: </label>
          <input
            type="number"
            step="0.5"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Bathrooms: </label>
          <input
            type="number"
            step="0.5"
            value={bathrooms}
            onChange={(e) => setBathrooms(e.target.value)}
            required
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={canRent}
              onChange={(e) => setCanRent(e.target.checked)}
            />
            Available to rent
          </label>
        </div>

        <button type="submit">Save</button>
      </form>
    </div>
  );
}
