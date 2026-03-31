import { useState } from "react";

export const MessageInput = ({ onSend, disabled }) => {
  const [value, setValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: 10,
        borderTop: "1px solid rgba(30,64,175,0.6)",
        display: "flex",
        gap: 8,
        background: "#020617",
      }}
    >
      <input
        placeholder="Напишите сообщение..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        style={{
          flex: 1,
          padding: "8px 10px",
          borderRadius: 999,
          border: "1px solid rgba(148,163,184,0.4)",
          background: "#020617",
          color: "#e5e7eb",
        }}
      />
      <button
        type="submit"
        disabled={disabled}
        style={{
          padding: "8px 16px",
          borderRadius: 999,
          border: "none",
          background: "linear-gradient(135deg, #3b82f6, #22c55e)",
          color: "#020617",
          fontWeight: 600,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        Отпр.
      </button>
    </form>
  );
};