/* 
  NAME: Profile.jsx
  AUTHOR: Jeffrey Fosgate
  DATE OF FIRST COMMIT: December 3, 2025
  DESCRIPTION: A simple interface for personal profiles within MainePad Finder.
*/

/* TODO: Implement property list for landlords */

import { useEffect, useState } from "react";

export default function Profile() {

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState("")
  const [properties, setProperties] = useState([])

  useEffect(() => {
    fetch("/api/profile").then(response => /* I THINK this is how retrieving data from the backend works... */
      response.json().then(data => {
        setProfile(data)
      })
    )

    if (loading) return <p>Loading profile...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    const gender_text = "(they / them)"
    switch (profile.gender) {
      case 'M':
        gender_text = "(he / him)"
        break;
      case 'F':
        gender_text = "(she / her)"
        break;
    }
    
    return (
      <>
        <h1 style="text-align: center">Profile: {profile.username}</h1>
        <h2 style="text-align: center"></h2>
        <h2 style="text-align: center"><i>{gender_text}</i></h2>
        {profile.picture_url && <img src={profile.picture_url} />}
        <hr />
        <h3>About Me:</h3>
        {profile.user_desc ? <p>{profile.user_desc}</p> : <p><i>No description provided.</i></p>}
        <hr />
        <h3>Contact Me:</h3>
        <h4>Email</h4>
        {profile.email ? <p>{profile.email}</p> : <p><i>No email provided.</i></p>}
        <h4>Phone Number</h4>
        {profile.phone_number ? <p>{profile.phone_number}</p> : <p><i>No phone number provided.</i></p>}
      </>
    );
  });
};

