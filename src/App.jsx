import { useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import { supabase } from "./supabaseClient";

function getRoleFromSession(session) {
  const role = session?.user?.user_metadata?.role;
  return role === "admin" || role === "cashier" ? role : null;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function initAuth() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const role = getRoleFromSession(data.session);
      setIsAuthenticated(Boolean(data.session && role));
      setUserRole(role);
      setAuthReady(true);
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const role = getRoleFromSession(session);
        setIsAuthenticated(Boolean(session && role));
        setUserRole(role);
      },
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogin() {
    const { data } = await supabase.auth.getSession();
    const role = getRoleFromSession(data.session);
    setIsAuthenticated(Boolean(data.session && role));
    setUserRole(role);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserRole(null);
  }

  if (!authReady) return null;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#4f46e5",
          borderRadius: 12,
          borderRadiusLG: 16,
          colorBgLayout: "transparent",
          colorText: "#0f172a",
          fontSize: 14,
        },
        components: {
          Button: {
            borderRadius: 12,
            controlHeight: 38,
            fontWeight: 700,
          },
          Table: {
            headerBg: "#f8faff",
            headerColor: "#1e293b",
            borderColor: "#e2e8f0",
          },
          Modal: {
            borderRadiusLG: 16,
          },
          Input: {
            borderRadius: 10,
          },
          InputNumber: {
            borderRadius: 10,
          },
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Navbar onLogout={handleLogout} role={userRole || "cashier"} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
