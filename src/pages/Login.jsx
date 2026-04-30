import { useState } from "react";
import { Card, Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { supabase } from "../supabaseClient";

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values) {
    setLoading(true);
    const email = values.username?.trim();
    const password = values.password;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session) {
      message.error("بيانات تسجيل الدخول غير صحيحة");
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role !== "admin" && role !== "cashier") {
      await supabase.auth.signOut();
      message.error("الحساب لا يملك صلاحية الدخول للنظام");
      setLoading(false);
      return;
    }

    await onLogin();
    message.success(role === "admin" ? "تم تسجيل الدخول" : "تم تسجيل دخول الكاشير");
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
            label="البريد الإلكتروني"
            name="username"
            rules={[
              { required: true, message: "ادخل البريد الإلكتروني" },
              { type: "email", message: "اكتب بريد إلكتروني صحيح" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="example@email.com" />
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
