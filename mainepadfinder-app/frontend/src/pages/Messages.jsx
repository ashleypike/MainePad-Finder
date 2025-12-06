// mainepadfinder-app/frontend/src/pages/Messages.jsx
import { useState } from "react";

export default function Messages() {
  const [recipientUsername, setRecipientUsername] = useState("");
  const [messageText, setMessageText] = useState("");

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendMessage, setSendMessage] = useState("");

  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState("");

  async function handleLoadThread(e) {
    e.preventDefault();
    setThreadError("");
    setMessages([]);

    const username = recipientUsername.trim();
    if (!username) {
      setThreadError("Please enter a username first.");
      return;
    }

    try {
      setLoadingThread(true);

      // GET conversation with this username
      const res = await fetch(
        `https://localhost:5000/api/messages/thread?username=${encodeURIComponent(
          username
        )}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setThreadError(data.error || "Failed to load conversation.");
        return;
      }

      setMessages(data);
    } catch (err) {
      console.error("Error loading conversation:", err);
      setThreadError("Network error while loading conversation.");
    } finally {
      setLoadingThread(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    setSendError("");
    setSendMessage("");

    const username = recipientUsername.trim();
    if (!username) {
      setSendError("Please enter a recipient username.");
      return;
    }
    if (!messageText.trim()) {
      setSendError("Message text cannot be empty.");
      return;
    }

    try {
      setSending(true);

      const res = await fetch("https://localhost:5000/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          recipientUsername: username,
          messageText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error || "Failed to send message.");
        return;
      }

      setSendMessage("Message sent!");

      // Optionally refresh the thread after sending
      setMessageText("");
      await handleLoadThread(new Event("submit"));
    } catch (err) {
      console.error("Error sending message:", err);
      setSendError("Network error while sending message.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: "2rem 3rem" }}>
      <h2>Messages</h2>
      <p style={{ maxWidth: "640px" }}>
        Send messages between users by looking them up with their username.
      </p>

      {/* Form for choosing recipient + loading conversation */}
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
          <label htmlFor="recipientUsername">Recipient username</label>
          <input
            id="recipientUsername"
            type="text"
            value={recipientUsername}
            onChange={(e) => setRecipientUsername(e.target.value)}
            placeholder="e.g., sophia123"
          />
        </div>

        <button type="submit" disabled={loadingThread}>
          {loadingThread ? "Loading..." : "Load conversation"}
        </button>
      </form>

      {threadError && (
        <p style={{ color: "red", marginBottom: "0.5rem" }}>{threadError}</p>
      )}

      {/* Send message form */}
      <form
        onSubmit={handleSend}
        style={{
          margin: "1rem 0 1.5rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "480px",
        }}
      >
        <label htmlFor="messageText">
          Message
          <textarea
            id="messageText"
            rows={3}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>

        <button type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send message"}
        </button>

        {sendError && (
          <p style={{ color: "red", fontSize: "0.9rem" }}>{sendError}</p>
        )}
        {sendMessage && (
          <p style={{ color: "green", fontSize: "0.9rem" }}>{sendMessage}</p>
        )}
      </form>

      {/* Messages list */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "1rem",
          maxWidth: "720px",
          maxHeight: "380px",
          overflowY: "auto",
          background: "#fafafa",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: "#666" }}>
            No messages to show yet. Load a conversation or send a message.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {messages.map((m) => (
              <li
                key={m.MSG_ID ?? m.id}
                style={{
                  marginBottom: "0.75rem",
                  paddingBottom: "0.5rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#555",
                    marginBottom: "0.15rem",
                  }}
                >
                  <strong>{m.senderUsername || m.SENDER_USERNAME}</strong>{" "}
                  →{" "}
                  <strong>{m.recipientUsername || m.RECIPIENT_USERNAME}</strong>{" "}
                  • {m.TIME_STAMP || m.timestamp}
                </div>
                <div>{m.MESSAGE_TEXTS || m.messageText}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
