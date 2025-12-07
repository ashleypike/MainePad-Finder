/* 
  NAME: Profile.jsx
  AUTHOR: Jeffrey Fosgate
  DATE OF FIRST COMMIT: December 3, 2025
  LAST UPDATED: December 7, 2025
  DESCRIPTION: A simple interface for personal profiles within MainePad Finder.
*/

import { useEffect, useState } from "react";

export default function Profile() {

  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
  async function loadProfile() {
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error("Could not load profile");
      const data = await res.json();
      setProfile(data);

      if (data.IS_LANDLORD) {
        const propRes = await fetch("/api/profile/properties");
        if (!propRes.ok) throw new Error("Could not load properties");
        const propData = await propRes.json();
        setProperties(propData);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  loadProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (!profile) return <p>No profile data available.</p>; // This should never display, due to @login_required. This'll remain here for testing purposes.

  let gender_text = "(they / them)";
  if (profile.GENDER === "M") gender_text = "(he / him)";
  if (profile.GENDER === "F") gender_text = "(she / her)";

  return (
    <div style={{maxWidth: "600px", margin:"0 auto"}}>
      <h1 style={{textAlign: "center"}}>
        Profile: {profile.DISPLAY_NAME}
      </h1>
      <h2 style={{textAlign: "center"}}>
        <i>{gender_text}</i>
      </h2>

      {profile.PICTURE_URL && (
        <img
          src={profile.PICTURE_URL}
          alt="Profile"
        />
      )}

      <hr />

      <h3>About Me:</h3>
      {profile.USER_DESC ? (
        <p>{profile.USER_DESC}</p>
      ) : (
        <p><i>No description provided.</i></p>
      )}

      <hr />

      <h3>Contact Me:</h3>

      <h4>Email</h4>
      {profile.EMAIL ? (
        <p>{profile.EMAIL}</p>
      ) : (
        <p><i>No email provided.</i></p>
      )}

      <h4>Phone Number</h4>
      {profile.PHONE_NUMBER ? (
        <p>{profile.PHONE_NUMBER}</p>
      ) : (
        <p><i>No phone number provided.</i></p>
      )}

    {profile.IS_LANDLORD ? (
      <>
        <h2>Properties I Manage</h2>

        {properties.length === 0 ? (
          <p>No properties.</p>
        ) : (
          <ul>
            {properties.map((p) => (
              <li key={p.PROPERTY_ID}>
                <strong> Property {p.PROPERTY_ID}</strong>
                <br />
                Rent: ${p.RENT_COST}
                <br />
                Beds: {p.BEDROOMS} • Baths: {p.BATHROOMS}
                <br />
                Status: {p.CAN_RENT ? "Available" : "Not Available"}
              </li>
            ))}
          </ul>
        )}
      </>
    ) : (
      <h2><i>Renter</i></h2>
    )}
    </div>
  );
};

