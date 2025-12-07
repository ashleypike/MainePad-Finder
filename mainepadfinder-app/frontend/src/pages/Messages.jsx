// mainepadfinder-app/frontend/src/pages/Messages.jsx
import { useEffect, useState } from "react";

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState("");

  const [otherUsername, setOtherUsername] = useState("");
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState("");

  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendSuccess, setSendSuccess] = useState("");

  // check who is logged in
  useEffect(() => {
    async function loadMe() {
      setLoadingUser(true);
      setUserError("");
      try {
        const response = await fetch("https://localhost:5000/api/me", {
          credentials: "include",
        });

        if (response.status === 401) {
          setCurrentUser(null);
        } else {
          const data = await response.json();
          setCurrentUser(data);
        }
      } catch (err) {
        console.error("Error loading /api/me:", err);
        setUserError("Could not check login status.");
      } finally {
        setLoadingUser(false);
      }
    }

    loadMe();
  }, []);

  async function handleLoadThread(e) {
    e.preventDefault();
    setThreadError("");
    setMessages([]);

    if (!otherUsername.trim()) {
      setThreadError("Please enter a username.");
      return;
    }

    setLoadingThread(true);
    try {
      const url = new URL("https://localhost:5000/api/messages/thread");
      url.searchParams.set("otherUsername", otherUsername.trim());

      const response = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setThreadError(data.error || "Could not load messages.");
        setMessages([]);
      } else {
        setMessages(data);
      }
    } catch (err) {
      console.error("Error loading messages thread:", err);
      setThreadError("Network error while loading messages.");
      setMessages([]);
    } finally {
      setLoadingThread(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    setSendError("");
    setSendSuccess("");

    if (!otherUsername.trim()) {
      setSendError("Please enter a username to message.");
      return;
    }
    if (!messageText.trim()) {
      setSendError("Please enter a message.");
      return;
    }

    setSending(true);
    try {
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

      const data = await response.json();

      if (!response.ok) {
        setSendError(data.error || "Could not send message.");
      } else {
        setSendSuccess("Message sent.");
        setMessageText("");

        // refresh the thread so the new message shows up
        await handleLoadThread(new Event("submit"));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setSendError("Network error while sending message.");
    } finally {
      setSending(false);
    }
  }

  if (loadingUser) {
    return (
      <div style={{ padding: "2rem 3rem" }}>
        <h2>Messages</h2>
        <p>Checking login status...</p>
      </div>
    );
  }

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

  return (
    <div style={{ padding: "2rem 3rem" }}>
      <h2>Messages</h2>
      <p style={{ maxWidth: "620px" }}>
        You are logged in as <strong>{currentUser.username}</strong>. Enter
        another user&apos;s username to view your conversation history and send
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
