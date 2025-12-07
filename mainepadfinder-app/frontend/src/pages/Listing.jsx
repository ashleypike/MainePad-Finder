// Title: mainepadfinder-app/frontend/src/pages/Listing.jsx
// Author: Sophia Priola
// Listing page shows details for a single property with the ability to leave a review
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";

export default function Listing() {
  const location = useLocation(); //useLocation let us read the property data passed in through Propertie.jsx
  const navigate = useNavigate(); //useNavigate lets us move the user back and forth between pages 
  const { id } = useParams(); // useParams grabs the id part from the URL  

  const property = location.state?.property || null; //listing is the one clicked on from the Properties.jsx page 
  const allProperties = location.state?.allProperties || null; //allProperties holds the whole list so we can use next and prev

  // Interpret availability CAN_RENT = available 
  function isAvailableFromRaw(p) { 
    if (!p) return false;

    const raw = "canRent" in p ? p.canRent : p.CAN_RENT;

    if (typeof raw === "boolean") {
      // false (from 0) = available, true (from 1) = not
      return raw === false;
    }

    if (typeof raw === "number") {
      return raw === 0; // 0 = available
    }

    if (raw === null || raw === undefined) {
      // unknown treat as available
      return true;
    }

    return false;
  }

  // formats bedroom count into a string 
  function formatBedsDetail(beds) {
    if (beds === 0) return "Studio";
    if (beds == null) return "Unknown";
    if (beds === 1) return "1 bedroom";
    return `${beds} bedrooms`;
  }

  // Normalize everything we care about
  // This takes whatever structure the property object has and makes a clean, consistent object
  function normalize(p) {
    if (!p) return null;
    const available = isAvailableFromRaw(p);

    const city = p.city ?? p.CITY ?? "Unknown city";
    const state = p.state ?? p.STATE_CODE ?? "??";

    const addressLine1 = p.addressLine1 ?? p.ADDRESS_LINE1 ?? null;
    const addressLine2 = p.addressLine2 ?? p.ADDRESS_LINE2 ?? null;
    const zipCode = p.zipCode ?? p.ZIP_CODE ?? null;

    const unitLabel = p.unitLabel ?? p.UNIT_LABEL ?? null;

    // Our heading is address if we have it, otherwise city + state
    let heading = addressLine1;
    if (!heading) {
      heading = `${city}, ${state}`;
    }

    return {
      id: p.id ?? p.PROPERTY_ID ?? id,
      heading,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      unitLabel,
      rent: p.rent ?? p.RENT_COST,
      beds: p.beds ?? p.BEDROOMS,
      baths: p.baths ?? p.BATHROOMS,
      sqft: p.sqft ?? p.SQFT,
      canRent: available,
      landlordName: p.landlordName ?? p.LANDLORD_NAME ?? null,
      landlordEmail: p.landlordEmail ?? p.LANDLORD_EMAIL ?? null,

      // average rating, if the backend sends it 
      avgRating: p.avgRating ?? p.AVG_RATING ?? null,

      raw: p,
    };
  }

  // n is the normalized version of the property we are showing on this page
  const n = normalize(property);

  // numeric rating (0–5), default to 0 if we have no reviews yet
  const avgRating = n?.avgRating;
  const normalizedRating =
    typeof avgRating === "number" ? avgRating : 0;

  // Prev and Next navigation for listing page
  // useMemo so we only recompute the index when the dependencies change
  const { indexInList, totalInList } = useMemo(() => {
    if (!allProperties || !property) return { indexInList: null, totalInList: null };

    // pull out the id of this property in a safe way
    const thisId = property.id ?? property.PROPERTY_ID ?? id;
    const idx = allProperties.findIndex(
      (p) => (p.id ?? p.PROPERTY_ID) === thisId
    );

    return {
      indexInList: idx === -1 ? null : idx,
      totalInList: allProperties.length,
    };
  }, [allProperties, property, id]);

  // Go to a different property by index in the list (for previous / next buttons)
  function goToIndex(newIndex) {
    if (!allProperties || newIndex == null) return;
    if (newIndex < 0 || newIndex >= allProperties.length) return;

    const nextProp = allProperties[newIndex];
    const nextId = nextProp.id ?? nextProp.PROPERTY_ID;

    // navigate to the same Listing page but with a different property id and state
    navigate(`/listing/${nextId}`, {
      state: { property: nextProp, allProperties },
    });
  }

  //when the user clicks "Previous Listing" button
  function handlePrev() {
    if (indexInList == null) return;
    goToIndex(indexInList - 1);
  }

  //when the user clicks "Next Listing" button 
  function handleNext() {
    if (indexInList == null) return;
    goToIndex(indexInList + 1);
  }

  // simple local state for creating a review
  const [starsInput, setStarsInput] = useState(""); // starsInput holds the rating value entered by the user
  const [commentInput, setCommentInput] = useState(""); // commentInput holds the comment left by user 
  const [savingReview, setSavingReview] = useState(false); //savingReview checks if we are sending to backend 
  const [reviewError, setReviewError] = useState(""); //ReviewError sends error if something is wrong
  const [reviewMessage, setReviewMessage] = useState(""); // reviewMessage shows success if review saved successfully

  // Handle review form submission
  async function handleSubmitReview(e) {
    e.preventDefault();
    setReviewError("");
    setReviewMessage("");
    setSavingReview(true);

    try {
      //POST review to the backend for this specific property id 
      const response = await fetch(
        `https://localhost:5000/api/listing/${n.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            stars: starsInput,
            comments: commentInput,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setReviewError(data.error || "Failed to save review."); //if something is wrong show error message 
      } else {
        setReviewMessage("Review submitted!"); // if all is well show success message 
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setReviewError("Network error while saving review.");
    } finally {
      setSavingReview(false);
    }
  }

  //Our formatting starts here 

  // If user hit /listing/:id directly, show message 
  // This happens if there is no property in the router state, so we send them back
  if (!property || !n) {
    return (
      <div style={{ padding: "2rem 3rem" }}>
        <button
          type="button"
          onClick={() => navigate("/properties")}
          style={{
            marginBottom: "1rem",
            padding: "0.4rem 0.9rem",
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            background: "white",
            cursor: "pointer",
          }}
        >
          ← Back to Properties
        </button>
        <h2>Listing not loaded</h2>
        <p style={{ maxWidth: "520px" }}>
          We couldn&apos;t load this listing directly. Please go back to the{" "}
          <strong>Properties</strong> page and click on a property to view its
          details.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 3rem" }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "1rem",
          padding: "0.4rem 0.9rem",
          borderRadius: "999px",
          border: "1px solid #e5e7eb",
          background: "white",
          cursor: "pointer",
        }}
      >
        ← Back to Properties
      </button>

      {indexInList != null && totalInList != null && (
        <p style={{ margin: "0 0 0.75rem 0", color: "#555" }}>
          Listing <strong>{indexInList + 1}</strong> of{" "}
          <strong>{totalInList}</strong>
        </p>
      )}

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.5rem 1.75rem",
          maxWidth: "720px",
          background: "#ffffff",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        }}
      >
        {/* Big heading = address or city/state */}
        <h2 style={{ marginTop: 0 }}>{n.heading}</h2>

        {/* Full address block */}
        <div style={{ marginBottom: "0.75rem", color: "#555" }}>
          {n.addressLine1 && <div>{n.addressLine1}</div>}
          {n.addressLine2 && <div>{n.addressLine2}</div>}
          <div>
            {n.city}, {n.state} {n.zipCode || ""}
          </div>
        </div>

        {/* Unit number */}
        <p>
          <strong>Unit: </strong>
          {n.unitLabel || "N/A"}
        </p>

        {/* Rent */}
        <p style={{ fontSize: "1.2rem" }}>
          <strong>${n.rent}</strong> / month
        </p>

        {/* Beds & baths */}
        <p>
          <strong>Bedrooms: </strong>
          {formatBedsDetail(n.beds)}
        </p>
        <p>
          <strong>Bathrooms: </strong>
          {n.baths ?? "Unknown"}
        </p>

        {/* Optional sqft */}
        {n.sqft && (
          <p>
            <strong>Square footage: </strong>
            {n.sqft} sq ft
          </p>
        )}

        {/* Availability */}
        <p>
          <strong>Status: </strong>
          {n.canRent ? (
            <span style={{ color: "green", fontWeight: "bold" }}>
              Available to rent
            </span>
          ) : (
            <span style={{ color: "gray" }}>Not currently available</span>
          )}
        </p>

        {/* Landlord */}
        <p>
          <strong>Landlord: </strong>
          {n.landlordName ? n.landlordName : "Not specified"}
        </p>
        {n.landlordEmail && (
          <p>
            <strong>Contact email: </strong>
            <a href={`mailto:${n.landlordEmail}`}>{n.landlordEmail}</a>
          </p>
        )}

        {/* Review / rating*/}
        <p>
          <strong>Review: </strong>
          {normalizedRating.toFixed(1)} / 5{" "}
          {avgRating == null && (
            <span style={{ color: "#666", fontSize: "0.9rem" }}>
              (no reviews yet)
            </span>
          )}
        </p>

        {/* create or update a review */}
        <hr style={{ margin: "1rem 0" }} />
        <h3>Leave a review</h3>
        <form
          onSubmit={handleSubmitReview}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            maxWidth: "320px",
          }}
        >
          <label>
            Rating (1–5):{" "}
            <input
              type="number"
              min="1"
              max="5"
              step="0.5"
              value={starsInput}
              onChange={(e) => setStarsInput(e.target.value)}
              style={{ marginLeft: "0.5rem", width: "80px" }}
              required
            />
          </label>

          <label>
            Comments (optional):
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              rows={3}
              style={{ width: "100%", marginTop: "0.25rem" }}
            />
          </label>

          <button type="submit" disabled={savingReview}>
            {savingReview ? "Saving..." : "Submit review"}
          </button>

          {reviewError && (
            <p style={{ color: "red", fontSize: "0.9rem" }}>{reviewError}</p>
          )}
          {reviewMessage && (
            <p style={{ color: "green", fontSize: "0.9rem" }}>
              {reviewMessage}
            </p>
          )}
        </form>

        <p>
          <strong>Internal ID: </strong>
          {n.id}
        </p>

        <hr style={{ margin: "1rem 0" }} />

        {indexInList != null && totalInList != null && totalInList > 1 && (
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              justifyContent: "space-between",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={handlePrev}
              disabled={indexInList <= 0}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid #e5e7eb",
                background:
                  indexInList <= 0 ? "#f9fafb" : "white",
                cursor: indexInList <= 0 ? "default" : "pointer",
              }}
            >
              ← Previous listing
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={indexInList >= totalInList - 1}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid #e5e7eb",
                background:
                  indexInList >= totalInList - 1 ? "#f9fafb" : "white",
                cursor:
                  indexInList >= totalInList - 1 ? "default" : "pointer",
              }}
            >
              Next listing →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
