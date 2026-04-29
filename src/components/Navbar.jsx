import { Layout, Menu, Button, Drawer, Grid } from "antd";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import {
  ShoppingCartOutlined,
  TeamOutlined,
  ShopOutlined,
  InboxOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import Inventory from "../pages/Inventory";
import Customers from "../pages/Customers";
import Traders from "../pages/Traders";
import Suppliers from "../pages/Suppliers";
import Reports from "../pages/Reports";

const { Sider, Content, Header } = Layout;
const { useBreakpoint } = Grid;

const items = [
  { key: "/", icon: <ShoppingCartOutlined />, label: "المبيعات" },
  { key: "/traders", icon: <TeamOutlined />, label: "التجار" },
  { key: "/suppliers", icon: <ShopOutlined />, label: "الموردين" },
  { key: "/inventory", icon: <InboxOutlined />, label: "المخزن" },
  { key: "/reports", icon: <BarChartOutlined />, label: "التقارير" },
];

export default function Navbar({ onLogout, role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAdmin = role === "admin";

  const allowedItems = isAdmin ? items : items.filter((item) => item.key === "/");
  const selectedKey = allowedItems.some((item) => item.key === location.pathname)
    ? location.pathname
    : "/";

  const menuNode = (
    <>
      <div className="app-brand">🏪 المعروف للسجاد</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={allowedItems}
        onClick={({ key }) => {
          navigate(key);
          setDrawerOpen(false);
        }}
      />
      <div className="logout-wrap">
        <Button
          danger
          type="primary"
          icon={<LogoutOutlined />}
          onClick={onLogout}
          style={{ width: "100%" }}
        >
          تسجيل خروج
        </Button>
      </div>
    </>
  );

  return (
    <Layout className="app-shell">
      {isMobile ? (
        <>
          <Header className="mobile-header">
            <Button
              type="text"
              className="mobile-menu-btn"
              icon={<MenuOutlined />}
              onClick={() => setDrawerOpen(true)}
            />
            <div className="mobile-brand">🏪 المعروف للسجاد</div>
          </Header>
          <Drawer
            placement="right"
            width={260}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            closable={false}
            className="mobile-nav-drawer"
            bodyStyle={{ padding: 0 }}
          >
            <div className="app-sider mobile-sider-content">{menuNode}</div>
          </Drawer>
        </>
      ) : (
        <Sider
          theme="dark"
          className="app-sider"
          style={{
            position: "fixed",
            height: "100vh",
            right: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1 }}>{menuNode}</div>
        </Sider>
      )}
      <Layout className="app-main">
        <Content className="app-content">
          <Routes>
            <Route path="/" element={<Customers />} />
            {isAdmin && <Route path="/inventory" element={<Inventory />} />}
            {isAdmin && <Route path="/traders" element={<Traders />} />}
            {isAdmin && <Route path="/suppliers" element={<Suppliers />} />}
            {isAdmin && <Route path="/reports" element={<Reports />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}
