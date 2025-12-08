// Title: mainepadfinder-app/frontend/src/pages/Properties.jsx
// Author: Sophia Priola
// Properties page allows users to filter and browse rental properties in Maine 
import { useState } from "react";
import { Link } from "react-router-dom";

// I only want to show 10 properties per page 
const PAGE_SIZE = 10;

export default function Properties() {
  //the filters that users can set on the page 
  const [city, setCity] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [minBeds, setMinBeds] = useState("");
  const [minBaths, setMinBaths] = useState("");

  const [properties, setProperties] = useState([]); // this holds the property data coming from the backend 
  const [page, setPage] = useState(1); //current number of pages 
  // loads the error state  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper: call backend with either filters or no filters
  async function fetchProperties({ useFilters }) {
    setLoading(true);
    setError("");

    const body = {};

    // filters on properties page
    if (useFilters) {
      body.city = city.trim() || null;
      body.minRent = minRent === "" ? null : Number(minRent);
      body.maxRent = maxRent === "" ? null : Number(maxRent);
      body.minBeds = minBeds === "" ? null : Number(minBeds);
      body.minBaths = minBaths === "" ? null : Number(minBaths);
    } else {
      // Explicitly send no filters
      body.city = null;
      body.minRent = null;
      body.maxRent = null;
      body.minBeds = null;
      body.minBaths = null;
    }

    try {
      //call the backend endpoint to get the property data 
      const response = await fetch("https://localhost:5000/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(body),
      });
      // parse the JSON response 
      const data = await response.json();

      // if the response is not ok we show the error message and clear the data 
      if (!response.ok) {
        setError(data.error || `Request failed with status ${response.status}`);
        setProperties([]);
        setPage(1);
        return;
      }

      // if everything is ok we store the properties and reset to the first page 
      setProperties(data);
      setPage(1); // reset to first page on new search
    } catch (err) {
      console.error("Error loading properties:", err);
      setError("Could not load properties (network error).");
      setProperties([]);
      setPage(1);
    } finally {
      //turn off the loading at the end 
      setLoading(false);
    }
  }

  // When the user clicks "Apply filters"
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchProperties({ useFilters: true });
  };

  const handleNoFilters = (e) => {
    e.preventDefault();

    //clear all filter inputs 
    setCity("");
    setMinRent("");
    setMaxRent("");
    setMinBeds("");
    setMinBaths("");
    //reload properties with no filters 
    fetchProperties({ useFilters: false });
  };

  // Best deals button handler (uses /api/properties/deals)
  const handleBestDeals = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // call the special endpoint that uses the BEST_DEAL_PROPERTIES view
      const response = await fetch(
        "https://localhost:5000/api/properties/deals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            // use current city if provided, otherwise null = all cities
            city: city.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Request failed with status ${response.status}`);
        setProperties([]);
        setPage(1);
        return;
      }

      // show the "deal" properties instead of normal search results
      setProperties(data);
      setPage(1);
    } catch (err) {
      console.error("Error loading best deals:", err);
      setError("Could not load best deals (network error).");
      setProperties([]);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = properties.length; // how many reponses we have from the backend 
  //how many pages we need based on PAGE_SIZE 
  const totalPages = 
    totalResults === 0 ? 1 : Math.ceil(totalResults / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE; //where the current page slice starts 
  const currentSlice = properties.slice(startIndex, startIndex + PAGE_SIZE); // the properties we actuall show on the page 

  // go to previous page if we are not of first one 
  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  // go to next page if there are more pags 
  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  // helper: interpret availability (0 = available, 1 = not)
  function isAvailableFromRaw(p) {
    if (!p) return false;

    const raw = "canRent" in p ? p.canRent : p.CAN_RENT;

    if (typeof raw === "boolean") {
      // backend sends bool from bool(CAN_RENT)
      // false (from 0) = available, true (from 1) = not
      return raw === false;
    }

    if (typeof raw === "number") {
      // 0 = available, 1 = not
      return raw === 0;
    }

    if (raw === null || raw === undefined) {
      // scraped data with no flag, we assume available so we don't hide it
      return true;
    }

    // anything weird, treat as not available
    return false;
  }

  // Our page formatting is here and below 

  // return the full properties page with filters and listings 
  return (
    <div style={{ padding: "2rem 3rem" }}>
      <h2>Browse Properties</h2>
      <p style={{ maxWidth: "600px" }}>
        Apply filters and browse available rental properties in Maine
      </p>
      <p
        style={{
          maxWidth: "600px",
          fontSize: "0.9rem",
          color: "#555",
          marginTop: "0.25rem",
        }}
      >
        Enter a city and click <strong> "Find me deals!"</strong> to find the best deals 
        in your city!
      </p>

      {/* Filter Form */}
      <form
        onSubmit={handleApplyFilters}
        style={{
          margin: "1rem 0",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="city">City</label>
          <input
            id="city"
            type="text"
            placeholder="e.g., Portland"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="minRent">Min rent</label>
          <input
            id="minRent"
            type="number"
            placeholder="e.g., 800"
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="maxRent">Max rent</label>
          <input
            id="maxRent"
            type="number"
            placeholder="e.g., 1500"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="minBeds">Min beds</label>
          <input
            id="minBeds"
            type="number"
            placeholder="e.g., 2"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
            min="0" // 0 = Studio; cannot go negative
            step="1" // only whole numbers
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="minBaths">Min baths</label>
          <input
            id="minBaths"
            type="number"
            placeholder="e.g., 1"
            value={minBaths}
            onChange={(e) => setMinBaths(e.target.value)}
            min="1" // should not be less than one bath
            step="1" // only whole numbers
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Apply filters"}
        </button>

        <button
          type="button"
          onClick={handleNoFilters}
          disabled={loading}
          style={{ marginLeft: "0.5rem" }}
        >
          {loading ? "Loading..." : "No filters"}
        </button>

        <button
          type="button"
          onClick={handleBestDeals}
          disabled={loading}
          style={{ marginLeft: "0.5rem" }}
        >
          {loading ? "Loading..." : "Find me deals!"}
        </button>
      </form>

      {/* Error message */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Summary + pagination controls */}
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <p>
          {totalResults === 0 ? (
            "No properties loaded yet."
          ) : (
            <>
              Showing{" "}
              <strong>
                {startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, totalResults)}
              </strong>{" "}
              of <strong>{totalResults}</strong> properties (page{" "}
              <strong>{page}</strong> of <strong>{totalPages}</strong>)
            </>
          )}
        </p>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handlePrevPage}
            disabled={page === 1 || totalResults === 0}
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages || totalResults === 0}
          >
            Next
          </button>
        </div>
      </div>

      {/*CLICKABLE to Listing page */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1rem",
        }}
      >
        {currentSlice.map((p) => {
          const id = p.id ?? p.PROPERTY_ID;
          const beds = p.beds ?? p.BEDROOMS;
          const baths = p.baths ?? p.BATHROOMS;
          const isAvailable = isAvailableFromRaw(p);

          const bedsLabel = beds === 0 ? "Studio" : `${beds ?? "?"} bed`;
          const rent = p.rent ?? p.RENT_COST;
          const cityLabel = p.city ?? p.CITY ?? "Unknown city";
          const stateLabel = p.state ?? p.STATE_CODE ?? "??";

          return (
            <Link
              key={id}
              to={`/listing/${id}`}
              state={{ property: p, allProperties: properties }}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  border: "1px solid #ccc",
                  padding: "1rem",
                  borderRadius: "8px",
                  background: "#fafafa",
                  cursor: "pointer",
                }}
              >
                <h3>{cityLabel}</h3>
                <p>
                  <strong>${rent}</strong> / month
                </p>
                <p>
                  {bedsLabel} • {baths ?? "?"} bath
                </p>
                {isAvailable ? (
                  <p style={{ color: "green", fontWeight: "bold" }}>
                    Available
                  </p>
                ) : (
                  <p style={{ color: "gray" }}>Not available</p>
                )}

                {/* We show how much less the deal is than average in city*/}
                {p.rentPctOfCityAvg && (
                  <p style={{ fontSize: "0.85rem", color: "#555" }}>
                    This property is ~{100 - p.rentPctOfCityAvg}% less than average rent in{" "}
                    {cityLabel}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}