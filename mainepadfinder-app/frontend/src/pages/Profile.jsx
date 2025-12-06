/* 
  NAME: Profile.jsx
  AUTHOR: Jeffrey Fosgate
  DATE OF FIRST COMMIT: December 3, 2025
  LAST UPDATED: December 6, 2025
  DESCRIPTION: A simple interface for personal profiles within MainePad Finder.
*/

/* TODO: Implement property list for landlords */

import { useEffect, useState } from "react";

export default function Profile() {

  useEffect(() => {
    fetch("/api/profile", {
      credentials: "include"
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load profile");
        }
        return response.json();
      })
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
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
        Profile: {profile.USERNAME}
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
    </div>
  );
};
