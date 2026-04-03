import { useState, useEffect } from "react";
import { ChatList } from "../components/ChatList";
import { ChatWindow } from "../components/ChatWindow";

export const ChatPage = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectChat = (chatId) => {
    setSelectedId(chatId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      {isMobile && isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      <ChatList
        selectedId={selectedId}
        onSelect={handleSelectChat}
        isMobile={isMobile}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <ChatWindow chatId={selectedId} isMobile={isMobile} onMenuOpen={() => setIsMobileMenuOpen(true)} />
    </>
  );
};