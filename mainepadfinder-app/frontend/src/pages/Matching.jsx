/* 
  NAME: Matching.jsx
  AUTHOR: Jeffrey Fosgate
  DATE OF FIRST COMMIT: December 8, 2025
  DESCRIPTION: A simple interface for matching profiles within MainePad Finder.
*/

export default function Matching() {

  const [matchmadeProfile, setMatchmadeProfile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleFeedback = async (liked) => {
    try {
      const response = await fetch("/api/matchmake/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          partner_id: matchmadeProfile.USER_ID,
          liked: liked
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
      } else {
        alert("Feedback recorded!");
        // maybe navigate somewhere or refresh
      }

    } catch (err) {
      setError("Network error");
    }
  };

  useEffect(() => {
  async function getMatchmadeProfile() {
    try {
      const res = await fetch("/api/matchmake");
      if (!res.ok) throw new Error("Cannot find a matchmaking partner.");
      const data = await res.json();
      setMatchmadeProfile(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  getMatchmadeProfile();
  }, []);

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  if (!matchmadeProfile) return <p>Could not find a profile to match with yours.</p>;
  
  if (matchmadeProfile.MATCHMADE) { /* If this profile has already been matchmade... */
    setIsBreakup(true)
    return (
      <div style={{maxWidth: "600px", margin:"0 auto"}}>
        <h1 style={{textAlign: "center"}}>
          You have already been matchmade with: {matchmadeProfile.DISPLAY_NAME}
        </h1>
        {matchmadeProfile.PICTURE_URL && (
          <img
            src={matchmadeProfile.PICTURE_URL}
            alt="Profile"
          />
        )}
        
      <h2><i>Are you still interested in this roommate?</i></h2>
      <form onSubmit={handleFeedback}>
        <button onClick={() => handleFeedback(true)}>
          Yes
        </button>
        <button onClick={() => handleFeedback(false)}>
          No
        </button>
      </form>
      </div>
    );
  }

/* Else... */
  
  return (
    <div style={{maxWidth: "600px", margin:"0 auto"}}>
      <h1 style={{textAlign: "center"}}>
        Matchmade Profile: {matchmadeProfile.DISPLAY_NAME}
      </h1>
      {matchmadeProfile.PICTURE_URL && (
        <img
          src={matchmadeProfile.PICTURE_URL}
          alt="Profile"
        />
      )}

      <h2><i>Are you interested in this roommate?</i></h2>
      <button onClick={() => handleFeedback(true)}>
        Yes
      </button>
      <button onClick={() => handleFeedback(false)}>
        No
      </button>
    </div>
  );
}
