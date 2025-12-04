import { useEffect, useState } from "react";

export default function ManageProperties() {
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProperties = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("https://localhost:5000/api/properties", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load properties");
        setProperties([]);
      } else {
        setProperties(data);
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const toggleAvailability = async (property) => {
    try {
      const res = await fetch(
        `https://localhost:5000/api/properties/${property.PROPERTY_ID}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canRent: !property.CAN_RENT }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update property");
        return;
      }

      // 本地更新
      setProperties((prev) =>
        prev.map((p) =>
          p.PROPERTY_ID === property.PROPERTY_ID
            ? { ...p, CAN_RENT: property.CAN_RENT ? 0 : 1 }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  if (loading) {
    return <div>Loading properties...</div>;
  }

  return (
    <div>
      <h1>Manage Properties</h1>

      {error && <p>{error}</p>}

      {properties.length === 0 ? (
        <p>No properties found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Address</th>
              <th>Rent</th>
              <th>Beds</th>
              <th>Baths</th>
              <th>Sqft</th>
              <th>Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.PROPERTY_ID}>
                <td>{p.PROPERTY_ID}</td>
                <td>
                  {p.UNIT_LABEL ? p.UNIT_LABEL + ", " : ""}
                  {p.STREET}, {p.CITY}, {p.STATE_CODE} {p.ZIPCODE}
                </td>
                <td>{p.RENT_COST}</td>
                <td>{p.BEDROOMS}</td>
                <td>{p.BATHROOMS}</td>
                <td>{p.SQFT}</td>
                <td>{p.CAN_RENT ? "Yes" : "No"}</td>
                <td>
                  <button onClick={() => toggleAvailability(p)}>
                    {p.CAN_RENT ? "Set Unavailable" : "Set Available"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
