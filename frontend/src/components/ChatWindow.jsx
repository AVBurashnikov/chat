import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages } from "../api/chats";
import { useAuth } from "../hooks/useAuth";
import { MessageInput } from "./MessageInput";

export const ChatWindow = ({ chatId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => getMessages(chatId),
    enabled: !!chatId,
  });
  const [socket, setSocket] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;
    const token = localStorage.getItem("token");
    const ws = new WebSocket(
      `ws://localhost:8000/ws/chats/${chatId}?token=${token}`
    );
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      queryClient.setQueryData(["messages", chatId], (old = []) => [...old, msg]);
    };
    setSocket(ws);
    return () => {
      ws.close();
      setSocket(null);
    };
  }, [chatId, queryClient]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (text) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ content: text }));
  };

  if (!chatId) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
        }}
      >
        Выберите чат слева
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "#020617",
      }}
    >
      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: "auto",
        }}
      >
        {messages.map((m) => {
          const mine = user && m.sender_id === user.id;
          const time = new Date(m.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          const initial = (m.sender_username || "?")[0]?.toUpperCase();

          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: mine ? "flex-end" : "flex-start",
                marginBottom: 6,
              }}
            >
              {!mine && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(148,163,184,0.2)",
                    color: "#e5e7eb",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  {initial}
                </div>
              )}
              <div
                style={{
                  maxWidth: "70%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: mine ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: 16,
                    borderBottomRightRadius: mine ? 4 : 16,
                    borderBottomLeftRadius: mine ? 16 : 4,
                    background: mine ? "#2563eb" : "#111827",
                    color: "#e5e7eb",
                    fontSize: 14,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  }}
                >
                  {m.content}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: "#6b7280",
                  }}
                >
                  {time}
                </div>
              </div>
              {mine && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(37,99,235,0.35)",
                    color: "#e5e7eb",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: 8,
                  }}
                >
                  {(user?.username || "?")[0]?.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <MessageInput onSend={handleSend} disabled={!socket} />
    </div>
  );
};