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
  Select,
  Card,
  Divider,
  Tag,
  AutoComplete,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  FileTextOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { supabase } from "../supabaseClient";

export default function Customers() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [searchProduct, setSearchProduct] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCartItems, setEditCartItems] = useState([]);
  const [editSearchProduct, setEditSearchProduct] = useState("");
  const [editProductOptions, setEditProductOptions] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select(`*, invoice_items(*, products(*)), customers(name, phone)`)
      .eq("type", "customer")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) message.error("حصل خطأ في جلب الفواتير");
    else setInvoices(data);
    setLoading(false);
  }

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("*").order("name");
    setProducts(data || []);
  }

  function handleProductSearch(value) {
    setSearchProduct(value);
    const filtered = products
      .filter((p) => p.name.includes(value) || p.size.includes(value))
      .map((p) => ({
        value: p.id,
        label: `${p.name} - ${p.size} - ${p.selling_price} ج (متاح: ${p.quantity})`,
        product: p,
      }));
    setProductOptions(filtered);
  }

  function handleProductSelect(value, option) {
    const product = option.product;
    const exists = cartItems.find((i) => i.product_id === product.id);
    if (exists) {
      setCartItems(
        cartItems.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * i.unit_price,
              }
            : i,
        ),
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          product_id: product.id,
          product_name: product.name,
          product_size: product.size,
          unit_price: product.selling_price,
          cost_price: product.cost_price,
          quantity: 1,
          total: product.selling_price,
          max_quantity: product.quantity,
        },
      ]);
    }
    setSearchProduct("");
  }

  function updatePrice(product_id, newPrice) {
    setCartItems(
      cartItems.map((i) =>
        i.product_id === product_id
          ? {
              ...i,
              unit_price: Number(newPrice || 0),
              total: i.quantity * Number(newPrice || 0),
            }
          : i,
      ),
    );
  }

  function updateQuantity(product_id, newQty) {
    setCartItems(
      cartItems.map((i) =>
        i.product_id === product_id
          ? { ...i, quantity: newQty, total: newQty * i.unit_price }
          : i,
      ),
    );
  }

  function removeItem(product_id) {
    setCartItems(cartItems.filter((i) => i.product_id !== product_id));
  }

  function openEditInvoice(invoice) {
    setEditingInvoice(invoice);
    setEditCustomerName(invoice.customers?.name || "");
    setEditCustomerPhone(invoice.customers?.phone || "");

    const mappedItems = (invoice.invoice_items || []).map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      const currentStock = product?.quantity || 0;
      return {
        product_id: item.product_id,
        product_name: item.product_name,
        product_size: item.product_size,
        unit_price: item.unit_price,
        cost_price: item.cost_price || 0,
        quantity: item.quantity,
        total: item.quantity * item.unit_price,
        max_quantity: currentStock + item.quantity,
      };
    });
    setEditCartItems(mappedItems);
    setEditSearchProduct("");
    setEditProductOptions([]);
    setEditModalOpen(true);
  }

  function handleEditProductSearch(value) {
    setEditSearchProduct(value);
    const filtered = products
      .filter((p) => p.name.includes(value) || p.size.includes(value))
      .map((p) => ({
        value: p.id,
        label: `${p.name} - ${p.size} - ${p.selling_price} ج (متاح: ${p.quantity})`,
        product: p,
      }));
    setEditProductOptions(filtered);
  }

  function handleEditProductSelect(value, option) {
    const product = option.product;
    const exists = editCartItems.find((i) => i.product_id === product.id);
    if (exists) {
      setEditCartItems(
        editCartItems.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                total: (i.quantity + 1) * i.unit_price,
              }
            : i,
        ),
      );
    } else {
      setEditCartItems([
        ...editCartItems,
        {
          product_id: product.id,
          product_name: product.name,
          product_size: product.size,
          unit_price: product.selling_price,
          cost_price: product.cost_price,
          quantity: 1,
          total: product.selling_price,
          max_quantity: product.quantity,
        },
      ]);
    }
    setEditSearchProduct("");
  }

  function updateEditPrice(product_id, newPrice) {
    setEditCartItems(
      editCartItems.map((i) =>
        i.product_id === product_id
          ? {
              ...i,
              unit_price: Number(newPrice || 0),
              total: i.quantity * Number(newPrice || 0),
            }
          : i,
      ),
    );
  }

  function updateEditQuantity(product_id, newQty) {
    setEditCartItems(
      editCartItems.map((i) =>
        i.product_id === product_id
          ? { ...i, quantity: newQty, total: newQty * i.unit_price }
          : i,
      ),
    );
  }

  function removeEditItem(product_id) {
    setEditCartItems(editCartItems.filter((i) => i.product_id !== product_id));
  }

  const totalAmount = cartItems.reduce((sum, i) => sum + i.total, 0);
  const editTotalAmount = editCartItems.reduce((sum, i) => sum + i.total, 0);

  async function handleSaveInvoice() {
    if (!customerName.trim()) return message.error("ادخل اسم الزبون");
    if (cartItems.length === 0) return message.error("أضف منتج واحد على الأقل");

    for (const item of cartItems) {
      if (item.quantity > item.max_quantity) {
        return message.error(
          `الكمية المطلوبة من "${item.product_name}" أكبر من المتاح في المخزن`,
        );
      }
      if (Number(item.unit_price) < Number(item.cost_price || 0)) {
        return message.error(
          `سعر بيع "${item.product_name}" لا يمكن أن يكون أقل من سعر الشراء`,
        );
      }
    }

    // إنشاء أو جلب الزبون (لا نربط على رقم موبايل فارغ)
    let customerId = null;
    const normalizedName = customerName.trim();
    const normalizedPhone = customerPhone.trim();
    let existingCustomer = null;

    if (normalizedPhone) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      existingCustomer = data;
    }

    if (!existingCustomer) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("name", normalizedName)
        .maybeSingle();
      existingCustomer = data;
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
      await supabase
        .from("customers")
        .update({ name: normalizedName, phone: normalizedPhone || null })
        .eq("id", customerId);
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({ name: normalizedName, phone: normalizedPhone || null })
        .select("id")
        .single();
      customerId = newCustomer?.id;
    }

    // إنشاء الفاتورة
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        type: "customer",
        customer_id: customerId,
        total_amount: totalAmount,
        paid_amount: totalAmount,
      })
      .select()
      .single();

    if (invoiceError) return message.error("حصل خطأ في حفظ الفاتورة");

    // حفظ تفاصيل الفاتورة
    const items = cartItems.map((i) => ({
      invoice_id: invoice.id,
      product_id: i.product_id,
      product_name: i.product_name,
      product_size: i.product_size,
      quantity: i.quantity,
      unit_price: i.unit_price,
      cost_price: i.cost_price,
    }));
    await supabase.from("invoice_items").insert(items);

    // تحديث المخزن
    for (const item of cartItems) {
      const product = products.find((p) => p.id === item.product_id);
      await supabase
        .from("products")
        .update({ quantity: product.quantity - item.quantity })
        .eq("id", item.product_id);

      await supabase.from("inventory_log").insert({
        product_id: item.product_id,
        product_name: item.product_name,
        change_type: "sale",
        quantity_change: -item.quantity,
        invoice_id: invoice.id,
      });
    }

    message.success("تم حفظ الفاتورة بنجاح!");
    setModalOpen(false);
    setCartItems([]);
    setCustomerName("");
    setCustomerPhone("");
    fetchInvoices();
    fetchProducts();
  }

  async function handleReturn(invoice) {
    const confirmed = await new Promise((resolve) => {
      Modal.confirm({
        title: "تأكيد المرتجع",
        content: `هترجع فاتورة رقم ${invoice.invoice_number}؟ المنتجات هترجع للمخزن.`,
        okText: "أيوه",
        cancelText: "لأ",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    if (!confirmed) return;

    await supabase
      .from("invoices")
      .update({ status: "returned" })
      .eq("id", invoice.id);

    for (const item of invoice.invoice_items) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        await supabase
          .from("products")
          .update({ quantity: product.quantity + item.quantity })
          .eq("id", item.product_id);
      }
      await supabase.from("inventory_log").insert({
        product_id: item.product_id,
        product_name: item.product_name,
        change_type: "return",
        quantity_change: item.quantity,
        invoice_id: invoice.id,
      });
    }

    message.success("تم تسجيل المرتجع");
    fetchInvoices();
    fetchProducts();
  }

  async function handleSaveEditedInvoice() {
    if (!editingInvoice) return;
    if (!editCustomerName.trim()) return message.error("ادخل اسم الزبون");
    if (editCartItems.length === 0)
      return message.error("أضف منتج واحد على الأقل");

    for (const item of editCartItems) {
      if (item.quantity > item.max_quantity) {
        return message.error(`الكمية من "${item.product_name}" أكبر من المتاح`);
      }
      if (Number(item.unit_price) < Number(item.cost_price || 0)) {
        return message.error(
          `سعر بيع "${item.product_name}" لا يمكن أن يكون أقل من سعر الشراء`,
        );
      }
    }

    let customerId = editingInvoice.customer_id;
    const normalizedName = editCustomerName.trim();
    const normalizedPhone = editCustomerPhone.trim();
    let existingCustomer = null;

    if (normalizedPhone) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      existingCustomer = data;
    }

    if (!existingCustomer) {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("name", normalizedName)
        .maybeSingle();
      existingCustomer = data;
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
      await supabase
        .from("customers")
        .update({ name: normalizedName, phone: normalizedPhone || null })
        .eq("id", customerId);
    } else {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({ name: normalizedName, phone: normalizedPhone || null })
        .select("id")
        .single();
      customerId = newCustomer?.id || customerId;
    }

    const oldQtyByProduct = new Map();
    (editingInvoice.invoice_items || []).forEach((item) => {
      oldQtyByProduct.set(
        item.product_id,
        (oldQtyByProduct.get(item.product_id) || 0) + item.quantity,
      );
    });
    const newQtyByProduct = new Map();
    editCartItems.forEach((item) => {
      newQtyByProduct.set(
        item.product_id,
        (newQtyByProduct.get(item.product_id) || 0) + item.quantity,
      );
    });

    const allProductIds = new Set([
      ...oldQtyByProduct.keys(),
      ...newQtyByProduct.keys(),
    ]);

    for (const productId of allProductIds) {
      const oldQty = oldQtyByProduct.get(productId) || 0;
      const newQty = newQtyByProduct.get(productId) || 0;
      const delta = newQty - oldQty;
      if (delta === 0) continue;

      const product = products.find((p) => p.id === productId);
      const currentQty = product?.quantity || 0;
      const updatedQty = currentQty - delta;
      if (updatedQty < 0) {
        return message.error("التعديل هيخلي المخزون بالسالب");
      }

      await supabase
        .from("products")
        .update({ quantity: updatedQty })
        .eq("id", productId);

      await supabase.from("inventory_log").insert({
        product_id: productId,
        product_name:
          editCartItems.find((i) => i.product_id === productId)?.product_name ||
          editingInvoice.invoice_items.find((i) => i.product_id === productId)
            ?.product_name,
        change_type: delta > 0 ? "sale_edit" : "return_edit",
        quantity_change: -delta,
        invoice_id: editingInvoice.id,
      });
    }

    await supabase
      .from("invoices")
      .update({
        customer_id: customerId,
        total_amount: editTotalAmount,
        paid_amount: editTotalAmount,
      })
      .eq("id", editingInvoice.id);

    await supabase.from("invoice_items").delete().eq("invoice_id", editingInvoice.id);
    await supabase.from("invoice_items").insert(
      editCartItems.map((i) => ({
        invoice_id: editingInvoice.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_size: i.product_size,
        quantity: i.quantity,
        unit_price: i.unit_price,
        cost_price: i.cost_price,
      })),
    );

    message.success("تم تعديل الفاتورة");
    setEditModalOpen(false);
    setEditingInvoice(null);
    fetchInvoices();
    fetchProducts();
  }

  function handlePrint(invoice) {
    const items = invoice.invoice_items || [];
    const invoiceCustomerName = invoice.customers?.name || "زبون";
    const printContent = `
      <html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial; direction: rtl; padding: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: right; }
        th { background: #f0f0f0; }
        .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: left; }
        .info { margin: 10px 0; }
      </style></head><body>
      <h2>🏪 المعروف للسجاد</h2>
      <div class="info">فاتورة رقم: ${invoice.invoice_number}</div>
      <div class="info">الزبون: ${invoiceCustomerName}</div>
      <div class="info">التاريخ: ${new Date(invoice.created_at).toLocaleString("ar-EG")}</div>
      <table>
        <tr><th>المنتج</th><th>المقاس</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
        ${items
          .map(
            (i) => `<tr>
          <td>${i.product_name}</td>
          <td>${i.product_size}</td>
          <td>${i.quantity}</td>
          <td>${i.unit_price} ج</td>
          <td>${i.total_price} ج</td>
        </tr>`,
          )
          .join("")}
      </table>
      <div class="total">الإجمالي: ${invoice.total_amount} ج</div>
      </body></html>
    `;
    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
    win.print();
  }

  const columns = [
    {
      title: "رقم الفاتورة",
      dataIndex: "invoice_number",
      key: "invoice_number",
      render: (v) => `#${v}`,
      width: 110,
    },
    {
      title: "الزبون",
      key: "customer_name",
      render: (_, r) => r.customers?.name || "-",
      width: 180,
    },
    {
      title: "رقم التليفون",
      key: "customer_phone",
      render: (_, r) => r.customers?.phone || "-",
      width: 150,
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      key: "created_at",
      render: (v) => new Date(v).toLocaleString("ar-EG"),
      width: 210,
    },
    {
      title: "الإجمالي",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (v) => `${v} ج`,
      width: 120,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (v) =>
        v === "active" ? (
          <Tag color="green">نشطة</Tag>
        ) : (
          <Tag color="red">مرتجعة</Tag>
        ),
      width: 100,
    },
    {
      title: "إجراءات",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            className="btn-action btn-details"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedInvoice(record);
              setDetailsModalOpen(true);
            }}
          >
            تفاصيل
          </Button>
          <Button
            className="btn-action btn-print"
            icon={<PrinterOutlined />}
            onClick={() => handlePrint(record)}
          >
            طباعة
          </Button>
          <Button
            className="btn-action btn-edit"
            icon={<EditOutlined />}
            onClick={() => openEditInvoice(record)}
          >
            تعديل
          </Button>
          <Popconfirm
            title="تسجيل مرتجع؟"
            onConfirm={() => handleReturn(record)}
            okText="أيوه"
            cancelText="لأ"
          >
            <Button danger>مرتجع</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="app-page-header">
        <h2 style={{ margin: 0 }}>🛒 فواتير الزباين</h2>
        <Button
          type="primary"
          className="btn-add"
          icon={<PlusOutlined />}
          onClick={() => {
            setCartItems([]);
            setModalOpen(true);
          }}
        >
          فاتورة جديدة
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={invoices}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
        scroll={{ x: "max-content" }}
      />

      {/* Modal الفاتورة الجديدة */}
      <Modal
        title="فاتورة جديدة"
        open={modalOpen}
        onOk={handleSaveInvoice}
        onCancel={() => setModalOpen(false)}
        okText="حفظ الفاتورة"
        cancelText="إلغاء"
        width={700}
      >
        <Divider>بيانات الزبون</Divider>
        <Space style={{ width: "100%", marginBottom: 16 }} direction="vertical">
          <Input
            placeholder="اسم الزبون *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            placeholder="رقم التليفون (اختياري)"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </Space>

        <Divider>المنتجات</Divider>
        <AutoComplete
          style={{ width: "100%", marginBottom: 16 }}
          options={productOptions}
          onSearch={handleProductSearch}
          onSelect={handleProductSelect}
          value={searchProduct}
          placeholder="🔍 ابحث عن منتج بالاسم أو المقاس..."
        />

        {cartItems.length > 0 && (
          <Table
            dataSource={cartItems}
            rowKey="product_id"
            pagination={false}
            size="small"
            columns={[
              { title: "المنتج", dataIndex: "product_name", key: "name" },
              { title: "المقاس", dataIndex: "product_size", key: "size" },
              {
                title: "الكمية",
                key: "quantity",
                render: (_, r) => (
                  <InputNumber
                    min={1}
                    max={r.max_quantity}
                    value={r.quantity}
                    onChange={(v) => updateQuantity(r.product_id, v)}
                    style={{ width: 70 }}
                  />
                ),
              },
              {
                title: "السعر",
                key: "price",
                render: (_, r) => (
                  <>
                    <InputNumber
                      min={0}
                      value={r.unit_price}
                      onChange={(v) => updatePrice(r.product_id, v)}
                      status={
                        Number(r.unit_price || 0) < Number(r.cost_price || 0)
                          ? "error"
                          : ""
                      }
                      style={{ width: 90 }}
                      formatter={(v) => `${v} ج`}
                    />
                    {Number(r.unit_price || 0) < Number(r.cost_price || 0) && (
                      <div style={{ color: "#cf1322", fontSize: 11, marginTop: 4 }}>
                        أقل من سعر الشراء
                      </div>
                    )}
                  </>
                ),
              },
              {
                title: "الإجمالي",
                key: "total",
                render: (_, r) => `${r.total} ج`,
              },
              {
                title: "",
                key: "del",
                render: (_, r) => (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(r.product_id)}
                  />
                ),
              },
            ]}
            footer={() => <strong>الإجمالي: {totalAmount} ج</strong>}
          />
        )}
      </Modal>

      <Modal
        title={`تعديل فاتورة #${editingInvoice?.invoice_number || ""}`}
        open={editModalOpen}
        onOk={handleSaveEditedInvoice}
        onCancel={() => setEditModalOpen(false)}
        okText="حفظ التعديل"
        cancelText="إلغاء"
        width={700}
      >
        <Divider>بيانات الزبون</Divider>
        <Space style={{ width: "100%", marginBottom: 16 }} direction="vertical">
          <Input
            placeholder="اسم الزبون *"
            value={editCustomerName}
            onChange={(e) => setEditCustomerName(e.target.value)}
          />
          <Input
            placeholder="رقم التليفون"
            value={editCustomerPhone}
            onChange={(e) => setEditCustomerPhone(e.target.value)}
          />
        </Space>

        <Divider>المنتجات</Divider>
        <AutoComplete
          style={{ width: "100%", marginBottom: 16 }}
          options={editProductOptions}
          onSearch={handleEditProductSearch}
          onSelect={handleEditProductSelect}
          value={editSearchProduct}
          placeholder="🔍 ابحث عن منتج بالاسم أو المقاس..."
        />

        {editCartItems.length > 0 && (
          <Table
            dataSource={editCartItems}
            rowKey="product_id"
            pagination={false}
            size="small"
            columns={[
              { title: "المنتج", dataIndex: "product_name", key: "name" },
              { title: "المقاس", dataIndex: "product_size", key: "size" },
              {
                title: "الكمية",
                key: "quantity",
                render: (_, r) => (
                  <InputNumber
                    min={1}
                    max={r.max_quantity}
                    value={r.quantity}
                    onChange={(v) => updateEditQuantity(r.product_id, v)}
                    style={{ width: 70 }}
                  />
                ),
              },
              {
                title: "السعر",
                key: "price",
                render: (_, r) => (
                  <>
                    <InputNumber
                      min={0}
                      value={r.unit_price}
                      onChange={(v) => updateEditPrice(r.product_id, v)}
                      status={
                        Number(r.unit_price || 0) < Number(r.cost_price || 0)
                          ? "error"
                          : ""
                      }
                      style={{ width: 90 }}
                      formatter={(v) => `${v} ج`}
                    />
                    {Number(r.unit_price || 0) < Number(r.cost_price || 0) && (
                      <div style={{ color: "#cf1322", fontSize: 11, marginTop: 4 }}>
                        أقل من سعر الشراء
                      </div>
                    )}
                  </>
                ),
              },
              {
                title: "الإجمالي",
                key: "total",
                render: (_, r) => `${r.total} ج`,
              },
              {
                title: "",
                key: "del",
                render: (_, r) => (
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeEditItem(r.product_id)}
                  />
                ),
              },
            ]}
            footer={() => <strong>الإجمالي: {editTotalAmount} ج</strong>}
          />
        )}
      </Modal>

      {/* Modal تفاصيل الفاتورة */}
      <Modal
        title={`تفاصيل فاتورة #${selectedInvoice?.invoice_number}`}
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={[
          <Button
            key="print"
            icon={<PrinterOutlined />}
            onClick={() => handlePrint(selectedInvoice)}
          >
            طباعة
          </Button>,
          <Button key="close" onClick={() => setDetailsModalOpen(false)}>
            إغلاق
          </Button>,
        ]}
        width={600}
      >
        {selectedInvoice && (
          <>
            <p>👤 الزبون: {selectedInvoice.customers?.name || "-"}</p>
            <p>
              📅 التاريخ:{" "}
              {new Date(selectedInvoice.created_at).toLocaleString("ar-EG")}
            </p>
            <p>💰 الإجمالي: {selectedInvoice.total_amount} ج</p>
            <Table
              dataSource={selectedInvoice.invoice_items}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                { title: "المنتج", dataIndex: "product_name" },
                { title: "المقاس", dataIndex: "product_size" },
                { title: "الكمية", dataIndex: "quantity" },
                {
                  title: "السعر",
                  dataIndex: "unit_price",
                  render: (v) => `${v} ج`,
                },
                {
                  title: "الإجمالي",
                  dataIndex: "total_price",
                  render: (v) => `${v} ج`,
                },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
