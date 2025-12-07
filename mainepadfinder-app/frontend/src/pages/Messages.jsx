// Title: mainepadfinder-app/frontend/src/pages/Messages.jsx
// Author: Sophia Priola
// This page handles messages between logged in users 
import { useEffect, useState } from "react";

export default function Messages() {

  const [currentUser, setCurrentUser] = useState(null); // current user will hold logged in users info from /api/me
  const [loadingUser, setLoadingUser] = useState(true); // shows loading state while checking /api/me 
  const [userError, setUserError] = useState(""); // error message if something fails 

  const [otherUsername, setOtherUsername] = useState(""); //username of the person we are messaging
  const [messages, setMessages] = useState([]); // array of messages in the conversation between current user and otherUsername
  const [loadingThread, setLoadingThread] = useState(false); // True when we are loading from the backend 
  const [threadError, setThreadError] = useState(""); // error message if loading fails 

  const [messageText, setMessageText] = useState(""); // Text of the message we are sending 
  const [sending, setSending] = useState(false); // True while we are sending message to the backend 
  const [sendError, setSendError] = useState(""); // error message if sending fails 
  const [sendSuccess, setSendSuccess] = useState(""); // success message when sending works 

  // check who is logged in by using /api/me when page first loads 
  useEffect(() => {
    async function loadMe() {
      setLoadingUser(true);
      setUserError("");
      try {
        //asks backend who is currrently logged in 
        const response = await fetch("https://localhost:5000/api/me", {
          credentials: "include", // make sure cookies go along with the request
        });

        // if the backend says 401 then no one is logged in 
        if (response.status === 401) {
          setCurrentUser(null);
        } else {
            //otherwise we parse the JSON and store the user object 
          const data = await response.json();
          setCurrentUser(data);
        }
      } catch (err) {
        //load the error message if something goes wrong 
        console.error("Error loading /api/me:", err);
        setUserError("Could not check login status.");
      } finally {
        //stop the loading 
        setLoadingUser(false);
      }
    }

    // call the helper function 
    loadMe();
  }, []); //empty list means this only runs once 

  //load the conversation with the other user by username 
  async function handleLoadThread(e) {
    // prevent from reloading the page 
    e.preventDefault();
    //reset errors and clear current messages 
    setThreadError("");
    setMessages([]);

    //they must enter the other username 
    if (!otherUsername.trim()) {
      setThreadError("Please enter a username.");
      return;
    }

    //show loading while we fetch the messages 
    setLoadingThread(true);
    try {
        // build the URL 
      const url = new URL("https://localhost:5000/api/messages/thread");
      url.searchParams.set("otherUsername", otherUsername.trim());

      // GET the thread for these two users 
      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });

      //parse response as JSON 
      const data = await response.json();

      // if the response is not ok show the error message and clear messages 
      if (!response.ok) {
        setThreadError(data.error || "Could not load messages.");
        setMessages([]);
      } else {
        //otherwise save the array of messages 
        setMessages(data);
      }
    } catch (err) {
        //network error
      console.error("Error loading messages thread:", err);
      setThreadError("Network error while loading messages.");
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  }

  //send a new message to the other user 
  async function handleSendMessage(e) {
    e.preventDefault();
    // clear previous errors and success messages 
    setSendError("");
    setSendSuccess("");

    //make sure there is a username entered 
    if (!otherUsername.trim()) {
      setSendError("Please enter a username to message.");
      return;
    }
    //make sure there is message text entered 
    if (!messageText.trim()) {
      setSendError("Please enter a message.");
      return;
    }

    //show sending state while we POST from backend 
    setSending(true);
    try {
        //POST to backend to send the message 
      const response = await fetch(
        "https://localhost:5000/api/messages/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            otherUsername: otherUsername.trim(),
            text: messageText,
          }),
        }
      );
      //parse response as JSON 
      const data = await response.json();

      //if backend does not accept we show the error message 
      if (!response.ok) {
        setSendError(data.error || "Could not send message.");
      } else {
        // Show the success message and clear the message box 
        setSendSuccess("Message sent.");
        setMessageText("");

        // refresh the thread so the new message shows up
        await handleLoadThread(new Event("submit"));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setSendError("Network error while sending message.");
    } finally {
        //done sending!
      setSending(false);
    }
  }

  // Our formatting is here and below 

  // show the loading state if we are still checking backend 
  if (loadingUser) {
    return (
      <div style={{ padding: "2rem 3rem" }}>
        <h2>Messages</h2>
        <p>Checking login status...</p>
      </div>
    );
  }

  // If no one is logged in, tell them to log in to see messages 
  if (!currentUser) {
    return (
      <div style={{ padding: "2rem 3rem" }}>
        <h2>Messages</h2>
        {userError && (
          <p style={{ color: "red", marginBottom: "0.75rem" }}>{userError}</p>
        )}
        <p style={{ maxWidth: "520px" }}>
          You need to be logged in to view and send messages. Please log in and
          then come back to this page.
        </p>
      </div>
    );
  }

  // Show our full messages page with prompt to enter the other users username 
  return (
    <div style={{ padding: "2rem 3rem" }}>
      <h2>Messages</h2>
      <p style={{ maxWidth: "620px" }}>
        You are logged in as <strong>{currentUser.username}</strong>. Enter
        another users username to view your conversation history and send
        messages.
      </p>

      {/* Choose who to talk to */}
      <form
        onSubmit={handleLoadThread}
        style={{
          margin: "1rem 0",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="otherUsername">Other username</label>
          <input
            id="otherUsername"
            type="text"
            value={otherUsername}
            onChange={(e) => setOtherUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>

        <button type="submit" disabled={loadingThread}>
          {loadingThread ? "Loading..." : "Load conversation"}
        </button>
      </form>

      {threadError && (
        <p style={{ color: "red", marginBottom: "0.75rem" }}>{threadError}</p>
      )}

      {/* Messages list */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1rem",
          minHeight: "180px",
          maxHeight: "360px",
          overflowY: "auto",
          marginBottom: "1rem",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: "#666" }}>No messages to show yet.</p>
        ) : (
          messages.map((m) => {
            const mine = m.isMine;
            return (
              <div
                key={m.msgId}
                style={{
                  display: "flex",
                  justifyContent: mine ? "flex-end" : "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    maxWidth: "70%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "12px",
                    background: mine ? "#dbeafe" : "#e5e7eb",
                    fontSize: "0.9rem",
                  }}
                >
                  <div style={{ marginBottom: "0.25rem" }}>
                    <strong>{mine ? "You" : m.senderUsername}</strong>
                  </div>
                  <div>{m.text}</div>
                  <div
                    style={{
                      marginTop: "0.25rem",
                      fontSize: "0.75rem",
                      color: "#555",
                    }}
                  >
                    {m.sentAt}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send a new message */}
      <form
        onSubmit={handleSendMessage}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "480px",
        }}
      >
        <label>
          Message:
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={3}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>

        <button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send message"}
        </button>

        {sendError && (
          <p style={{ color: "red", fontSize: "0.9rem" }}>{sendError}</p>
        )}
        {sendSuccess && (
          <p style={{ color: "green", fontSize: "0.9rem" }}>{sendSuccess}</p>
        )}
      </form>
    </div>
  );
}
