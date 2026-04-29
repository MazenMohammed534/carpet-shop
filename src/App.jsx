import { useEffect, useState } from "react";
import { ConfigProvider } from "antd";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";

const AUTH_KEY = "carpet-shop-auth";
const ROLE_KEY = "carpet-shop-role";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState("admin");

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_KEY);
    const savedRole = localStorage.getItem(ROLE_KEY);
    setIsAuthenticated(savedAuth === "true");
    if (savedRole === "admin" || savedRole === "cashier") {
      setUserRole(savedRole);
    }
  }, []);

  function handleLogin(role) {
    localStorage.setItem(AUTH_KEY, "true");
    localStorage.setItem(ROLE_KEY, role);
    setIsAuthenticated(true);
    setUserRole(role);
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ROLE_KEY);
    setIsAuthenticated(false);
    setUserRole("admin");
  }

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
                <Navbar onLogout={handleLogout} role={userRole} />
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
