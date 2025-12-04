import { useEffect, useState } from "react";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [city, setCity] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [minBeds, setMinBeds] = useState("");
  const [minBaths, setMinBaths] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  useEffect(() => {
    
  const filteredProperties = properties.filter((p) => {
    if (city && !p.city.toLowerCase().includes(city.toLowerCase())) return false;
    if (minRent && p.rent < Number(minRent)) return false;
    if (maxRent && p.rent > Number(maxRent)) return false;
    if (minBeds && p.beds < Number(minBeds)) return false;
    if (minBaths && p.baths < Number(minBaths)) return false;
    if (onlyAvailable && !p.canRent) return false;
    return true;
  });

  if (loading) return <p>Loading properties...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "2rem 3rem" }}>
      <h2 style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>Properties</h2>
      <p style={{ marginBottom: "1.5rem", color: "#555" }}>
        Browse apartments and houses collected from Apartments.com and Zillow.
      </p>

      {/* Filters */}
      <section
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          borderRadius: "10px",
          border: "1px solid #eee",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ marginBottom: "0.75rem" }}>Filter listings</h3>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ padding: "0.4rem 0.6rem" }}
          />
          <input
            type="number"
            placeholder="Min rent"
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", width: "110px" }}
          />
          <input
            type="number"
            placeholder="Max rent"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", width: "110px" }}
          />
          <input
            type="number"
            step="0.5"
            placeholder="Min beds"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", width: "95px" }}
          />
          <input
            type="number"
            step="0.5"
            placeholder="Min baths"
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
            style={{ padding: "0.4rem 0.6rem", width: "95px" }}
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            Only show available
          </label>
        </div>
      </section>

      {/* Results summary */}
      <p style={{ marginBottom: "0.75rem" }}>
        <strong>{filteredProperties.length}</strong> properties found
      </p>

      {/* Properties grid */}
      {filteredProperties.length === 0 ? (
        <p>No properties match your filters. Try widening your search.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
            marginTop: "0.5rem",
          }}
        >
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                padding: "1rem",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              <h3 style={{ marginBottom: "0.3rem" }}>
                {p.title || "Unnamed unit"}
              </h3>
              <p style={{ margin: 0, color: "#555" }}>
                {p.city}, {p.state}
              </p>
              <p style={{ margin: "0.5rem 0" }}>
                <strong>${p.rent}</strong> / month
              </p>
              <p style={{ margin: 0 }}>
                {p.beds} bed • {p.baths} bath
              </p>
              {!p.canRent && (
                <p style={{ marginTop: "0.4rem", color: "#b00", fontSize: "0.9rem" }}>
                  Currently not available
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )}
  );
}

