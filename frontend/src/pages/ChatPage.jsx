import { useState } from "react";
import { ChatList } from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";

export const ChatPage = () => {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <ChatList selectedId={selectedId} onSelect={setSelectedId} />
      <ChatWindow chatId={selectedId} />
    </>
  );
};