import { useState } from "react";
import { Card, Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "carpet123";

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values) {
    setLoading(true);
    const validUsername = import.meta.env.VITE_LOGIN_USERNAME || DEFAULT_USERNAME;
    const validPassword = import.meta.env.VITE_LOGIN_PASSWORD || DEFAULT_PASSWORD;

    if (
      values.username?.trim() === validUsername &&
      values.password === validPassword
    ) {
      onLogin();
      message.success("تم تسجيل الدخول");
    } else {
      message.error("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f7fb",
        padding: 16,
        direction: "rtl",
      }}
    >
      <Card style={{ width: 420, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ marginBottom: 8 }}>🏪 المعروف للسجاد</h2>
          <p style={{ margin: 0, color: "#777" }}>تسجيل الدخول للنظام</p>
        </div>

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="اسم المستخدم"
            name="username"
            rules={[{ required: true, message: "ادخل اسم المستخدم" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="اسم المستخدم" />
          </Form.Item>

          <Form.Item
            label="كلمة المرور"
            name="password"
            rules={[{ required: true, message: "ادخل كلمة المرور" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="كلمة المرور" />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} block>
            دخول
          </Button>
        </Form>
      </Card>
    </div>
  );
}
