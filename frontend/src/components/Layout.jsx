import { useAuth } from "../hooks/useAuth";

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1f2933, #111827)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1100,
          height: "90vh",
          background: "#0f172a",
          borderRadius: 18,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(148,163,184,0.15)",
        }}
      >
        <header
          style={{
            height: 56,
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "radial-gradient(circle at 0 0, rgba(56,189,248,0.25), transparent 60%), #020617",
            borderBottom: "1px solid rgba(148,163,184,0.2)",
          }}
        >
          <div style={{ color: "#e5e7eb", fontWeight: 600 }}>Chat Clone</div>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#9ca3af" }}>
                {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
              </span>
              <button
                onClick={logout}
                style={{
                  fontSize: 12,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.4)",
                  background: "rgba(15,23,42,0.8)",
                  color: "#e5e7eb",
                  cursor: "pointer",
                }}
              >
                Выйти
              </button>
            </div>
          )}
        </header>
        <main style={{ flex: 1, display: "flex", background: "#020617" }}>
          {children}
        </main>
      </div>
    </div>
  );
};