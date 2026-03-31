import { useState } from "react";
import { Layout } from "./components/Layout";
import { useAuth } from "./hooks/useAuth";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatPage } from "./pages/ChatPage";

export const App = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState("login");

  let content;
  if (!user) {
    content =
      mode === "login" ? (
        <LoginPage
          onSwitch={() => setMode("register")}
          onSuccess={() => setMode("login")}
        />
      ) : (
        <RegisterPage onSwitch={() => setMode("login")} />
      );
  } else {
    content = <ChatPage />;
  }

  return <Layout>{content}</Layout>;
};