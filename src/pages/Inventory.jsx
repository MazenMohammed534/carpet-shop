import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  Popconfirm,
  message,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { supabase } from "../supabaseClient";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name");
    if (error) message.error("حصل خطأ في جلب المنتجات");
    else setProducts(data);
    setLoading(false);
  }

  function openAdd() {
    setEditingProduct(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update(values)
        .eq("id", editingProduct.id);
      if (error) return message.error("حصل خطأ");
      message.success("تم التعديل");
    } else {
      const { error } = await supabase.from("products").insert(values);
      if (error) return message.error("حصل خطأ");
      message.success("تم الإضافة");
    }
    setModalOpen(false);
    fetchProducts();
  }

  async function handleDelete(id) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return message.error("حصل خطأ في الحذف");
    message.success("تم الحذف");
    fetchProducts();
  }

  const columns = [
    {
      title: "اسم المنتج",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "المقاس",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "سعر البيع",
      dataIndex: "selling_price",
      key: "selling_price",
      render: (val) => `${val} ج`,
      sorter: (a, b) => a.selling_price - b.selling_price,
    },
    {
      title: "سعر الشراء",
      dataIndex: "cost_price",
      key: "cost_price",
      render: (val) => `${val} ج`,
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
      render: (val, record) =>
        val <= record.min_quantity ? (
          <Tag color="red" icon={<WarningOutlined />}>
            {val} - مخزون منخفض
          </Tag>
        ) : (
          <Tag color="green">{val}</Tag>
        ),
    },
    {
      title: "إجراءات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            className="btn-action btn-edit"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            تعديل
          </Button>
          <Popconfirm
            title="هتحذف المنتج ده؟"
            onConfirm={() => handleDelete(record.id)}
            okText="أيوه"
            cancelText="لأ"
          >
            <Button danger icon={<DeleteOutlined />}>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>📦 المخزن</h2>
        <Button type="primary" className="btn-add" icon={<PlusOutlined />} onClick={openAdd}>
          إضافة منتج
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
      />

      <Modal
        title={editingProduct ? "تعديل منتج" : "إضافة منتج جديد"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="اسم المنتج"
            rules={[{ required: true, message: "ادخل اسم المنتج" }]}
          >
            <Input placeholder="مثال: سجادة شاگي" />
          </Form.Item>
          <Form.Item
            name="size"
            label="المقاس"
            rules={[{ required: true, message: "ادخل المقاس" }]}
          >
            <Input placeholder="مثال: 2×3" />
          </Form.Item>
          <Form.Item
            name="selling_price"
            label="سعر البيع (ج)"
            rules={[{ required: true, message: "ادخل سعر البيع" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="cost_price"
            label="سعر الشراء (ج)"
            rules={[{ required: true, message: "ادخل سعر الشراء" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="الكمية"
            rules={[{ required: true, message: "ادخل الكمية" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
          <Form.Item name="min_quantity" label="الحد الأدنى للتنبيه">
            <InputNumber style={{ width: "100%" }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
