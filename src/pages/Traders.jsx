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
  AutoComplete,
  Divider,
  Card,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  FileTextOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { supabase } from "../supabaseClient";

export default function Traders() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [traderName, setTraderName] = useState("");
  const [traderPhone, setTraderPhone] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [searchProduct, setSearchProduct] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editTraderName, setEditTraderName] = useState("");
  const [editTraderPhone, setEditTraderPhone] = useState("");
  const [editCartItems, setEditCartItems] = useState([]);
  const [editSearchProduct, setEditSearchProduct] = useState("");
  const [editProductOptions, setEditProductOptions] = useState([]);

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
  }, []);

  async function fetchInvoices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select(`*, invoice_items(*), payments(*), traders(name, phone)`)
      .eq("type", "trader")
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

  async function updateProductQuantitySafely(productId, expectedQuantity, nextQuantity) {
    if (nextQuantity < 0) return { ok: false, reason: "negative" };
    const { data, error } = await supabase
      .from("products")
      .update({ quantity: nextQuantity })
      .eq("id", productId)
      .eq("quantity", expectedQuantity)
      .select("id")
      .maybeSingle();
    if (error || !data) return { ok: false, reason: "conflict" };
    return { ok: true };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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
    setEditTraderName(invoice.traders?.name || "");
    setEditTraderPhone(invoice.traders?.phone || "");

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
    if (!traderName.trim()) return message.error("ادخل اسم التاجر");
    if (cartItems.length === 0) return message.error("أضف منتج واحد على الأقل");

    for (const item of cartItems) {
      if (item.quantity > item.max_quantity) {
        return message.error(
          `الكمية المطلوبة من "${item.product_name}" أكبر من المتاح`,
        );
      }
      if (Number(item.unit_price) < Number(item.cost_price || 0)) {
        return message.error(
          `سعر بيع "${item.product_name}" لا يمكن أن يكون أقل من سعر الشراء`,
        );
      }
    }

    // جلب أو إنشاء التاجر (نتجنب الربط الغلط لما التليفون يكون فاضي)
    let traderId = null;
    const normalizedName = traderName.trim();
    const normalizedPhone = traderPhone.trim();
    let existing = null;

    if (normalizedPhone) {
      const { data } = await supabase
        .from("traders")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      existing = data;
    }

    if (!existing) {
      const { data } = await supabase
        .from("traders")
        .select("id")
        .eq("name", normalizedName)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      traderId = existing.id;
      await supabase
        .from("traders")
        .update({ name: normalizedName, phone: normalizedPhone || null })
        .eq("id", traderId);
    } else {
      const { data: newTrader } = await supabase
        .from("traders")
        .insert({ name: normalizedName, phone: normalizedPhone || null })
        .select("id")
        .single();
      traderId = newTrader?.id;
    }

    const remaining = totalAmount - paidAmount;

    // إنشاء الفاتورة
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({
        type: "trader",
        trader_id: traderId,
        total_amount: totalAmount,
        paid_amount: paidAmount,
      })
      .select()
      .single();

    if (error) return message.error("حصل خطأ في حفظ الفاتورة");

    // تفاصيل الفاتورة
    await supabase.from("invoice_items").insert(
      cartItems.map((i) => ({
        invoice_id: invoice.id,
        product_id: i.product_id,
        product_name: i.product_name,
        product_size: i.product_size,
        quantity: i.quantity,
        unit_price: i.unit_price,
        cost_price: i.cost_price,
      })),
    );

    // تسجيل الدفعة الأولى لو دفع
    if (paidAmount > 0) {
      await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: paidAmount,
        notes: "دفعة أولى",
      });
    }

    // تحديث المخزن
    for (const item of cartItems) {
      const product = products.find((p) => p.id === item.product_id);
      const expectedQty = product?.quantity ?? 0;
      const nextQty = expectedQty - item.quantity;
      const stockUpdate = await updateProductQuantitySafely(
        item.product_id,
        expectedQty,
        nextQty,
      );
      if (!stockUpdate.ok) {
        return message.error(
          stockUpdate.reason === "negative"
            ? `الكمية لا تكفي لمنتج "${item.product_name}"`
            : `تم تعديل مخزون "${item.product_name}" من مستخدم آخر، أعد المحاولة`,
        );
      }

      await supabase.from("inventory_log").insert({
        product_id: item.product_id,
        product_name: item.product_name,
        change_type: "sale",
        quantity_change: -item.quantity,
        invoice_id: invoice.id,
      });
    }

    message.success("تم حفظ فاتورة التاجر!");
    setModalOpen(false);
    setCartItems([]);
    setTraderName("");
    setTraderPhone("");
    setPaidAmount(0);
    await refreshTraderDebt(traderId);
    fetchInvoices();
    fetchProducts();
  }

  async function handleAddPayment() {
    if (!paymentAmount || paymentAmount <= 0)
      return message.error("ادخل مبلغ صح");
    if (paymentAmount > selectedInvoice.remaining_amount) {
      return message.error("المبلغ أكبر من المتبقي");
    }

    await supabase.from("payments").insert({
      invoice_id: selectedInvoice.id,
      amount: paymentAmount,
    });

    const { data: freshInvoice } = await supabase
      .from("invoices")
      .select("paid_amount, remaining_amount")
      .eq("id", selectedInvoice.id)
      .maybeSingle();
    const latestPaid = freshInvoice?.paid_amount || 0;
    const latestRemaining = freshInvoice?.remaining_amount || 0;
    if (paymentAmount > latestRemaining) {
      return message.error("المبلغ أكبر من المتبقي الحالي");
    }
    const newPaid = latestPaid + paymentAmount;
    await supabase
      .from("invoices")
      .update({ paid_amount: newPaid })
      .eq("id", selectedInvoice.id);

    message.success("تم تسجيل الدفعة");
    setPaymentModalOpen(false);
    setPaymentAmount(0);
    await refreshTraderDebt(selectedInvoice.trader_id);
    fetchInvoices();
  }

  async function handleSaveEditedInvoice() {
    if (!editingInvoice) return;
    if (!editTraderName.trim()) return message.error("ادخل اسم التاجر");
    if (editCartItems.length === 0) return message.error("أضف منتج واحد على الأقل");

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

    let traderId = editingInvoice.trader_id;
    const normalizedName = editTraderName.trim();
    const normalizedPhone = editTraderPhone.trim();
    let existing = null;

    if (normalizedPhone) {
      const { data } = await supabase
        .from("traders")
        .select("id")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      existing = data;
    }

    if (!existing) {
      const { data } = await supabase
        .from("traders")
        .select("id")
        .eq("name", normalizedName)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      traderId = existing.id;
      await supabase
        .from("traders")
        .update({ name: normalizedName, phone: normalizedPhone || null })
        .eq("id", traderId);
    } else {
      const { data: newTrader } = await supabase
        .from("traders")
        .insert({ name: normalizedName, phone: normalizedPhone || null })
        .select("id")
        .single();
      traderId = newTrader?.id || traderId;
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
      const stockUpdate = await updateProductQuantitySafely(
        productId,
        currentQty,
        updatedQty,
      );
      if (!stockUpdate.ok) {
        return message.error(
          stockUpdate.reason === "negative"
            ? "التعديل هيخلي المخزون بالسالب"
            : "حصل تعارض على مخزون المنتجات، أعد المحاولة",
        );
      }

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

    const adjustedPaidAmount = Math.min(editingInvoice.paid_amount || 0, editTotalAmount);

    await supabase
      .from("invoices")
      .update({
        trader_id: traderId,
        total_amount: editTotalAmount,
        paid_amount: adjustedPaidAmount,
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
    await refreshTraderDebt(traderId);
    fetchInvoices();
    fetchProducts();
  }

  async function refreshTraderDebt(traderId) {
    if (!traderId) return;
    const { data: traderInvoices } = await supabase
      .from("invoices")
      .select("remaining_amount")
      .eq("type", "trader")
      .eq("status", "active")
      .eq("trader_id", traderId);

    const totalDebt = (traderInvoices || []).reduce(
      (sum, inv) => sum + (inv.remaining_amount || 0),
      0,
    );

    await supabase.from("traders").update({ total_debt: totalDebt }).eq("id", traderId);
  }

  async function handleDeleteInvoice(invoice) {
    for (const item of invoice.invoice_items || []) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;
      const currentQty = product.quantity || 0;
      const updatedQty = currentQty + item.quantity;
      const stockUpdate = await updateProductQuantitySafely(
        item.product_id,
        currentQty,
        updatedQty,
      );
      if (!stockUpdate.ok) {
        return message.error("حصل تعارض أثناء تحديث المخزون، أعد المحاولة");
      }

      await supabase.from("inventory_log").insert({
        product_id: item.product_id,
        product_name: item.product_name,
        change_type: "sale_delete_revert",
        quantity_change: item.quantity,
        invoice_id: invoice.id,
      });
    }

    const { error } = await supabase
      .from("invoices")
      .update({ status: "returned" })
      .eq("id", invoice.id);
    if (error) return message.error(error.message || "حصل خطأ أثناء حذف الفاتورة");

    await refreshTraderDebt(invoice.trader_id);
    message.success("تم حذف الفاتورة وإرجاع البضاعة للمخزن");
    fetchInvoices();
    fetchProducts();
  }

  function handlePrint(invoice) {
    const items = invoice.invoice_items || [];
    const payments = invoice.payments || [];
    const traderName = escapeHtml(invoice.traders?.name || "");
    const printContent = `
      <html><head><meta charset="utf-8">
      <style>
        body { font-family: Arial; direction: rtl; padding: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: right; }
        th { background: #f0f0f0; }
        .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
      </style></head><body>
      <h2>🏪 المعروف للسجاد - فاتورة تاجر</h2>
      <p>فاتورة رقم: ${invoice.invoice_number}</p>
      <p>التاجر: ${traderName}</p>
      <p>التاريخ: ${new Date(invoice.created_at).toLocaleString("ar-EG")}</p>
      <table>
        <tr><th>المنتج</th><th>المقاس</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr>
        ${items
          .map(
            (i) => `<tr>
          <td>${escapeHtml(i.product_name)}</td><td>${escapeHtml(i.product_size)}</td>
          <td>${escapeHtml(i.quantity)}</td><td>${escapeHtml(i.unit_price)} ج</td><td>${escapeHtml(i.total_price)} ج</td>
        </tr>`,
          )
          .join("")}
      </table>
      <div class="total">الإجمالي: ${invoice.total_amount} ج</div>
      <div class="total">المدفوع: ${invoice.paid_amount} ج</div>
      <div class="total">المتبقي: ${invoice.remaining_amount} ج</div>
      ${
        payments.length > 0
          ? `
        <h3>سجل الدفعات</h3>
        <table>
          <tr><th>التاريخ</th><th>المبلغ</th><th>ملاحظات</th></tr>
          ${payments
            .map(
              (p) => `<tr>
            <td>${new Date(p.payment_date).toLocaleString("ar-EG")}</td>
            <td>${escapeHtml(p.amount)} ج</td><td>${escapeHtml(p.notes || "")}</td>
          </tr>`,
            )
            .join("")}
        </table>
      `
          : ""
      }
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
      title: "التاجر",
      key: "trader",
      render: (_, r) => r.traders?.name || "-",
      width: 170,
    },
    {
      title: "رقم التليفون",
      key: "trader_phone",
      render: (_, r) => r.traders?.phone || "-",
      width: 150,
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      key: "date",
      render: (v) => new Date(v).toLocaleString("ar-EG"),
      width: 210,
    },
    {
      title: "الإجمالي",
      dataIndex: "total_amount",
      key: "total",
      render: (v) => `${v} ج`,
      width: 120,
    },
    {
      title: "المدفوع",
      dataIndex: "paid_amount",
      key: "paid",
      render: (v) => `${v} ج`,
      width: 120,
    },
    {
      title: "المتبقي",
      dataIndex: "remaining_amount",
      key: "remaining",
      render: (v) =>
        v > 0 ? <Tag color="red">{v} ج</Tag> : <Tag color="green">مسدد</Tag>,
      width: 130,
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
            className="btn-action btn-payment"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedInvoice(record);
              setPaymentAmount(0);
              setPaymentModalOpen(true);
            }}
            disabled={record.remaining_amount <= 0}
          >
            دفعة
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
            title="حذف الفاتورة؟"
            description="هيتم إلغاء الفاتورة وإرجاع البضاعة للمخزن."
            onConfirm={() => handleDeleteInvoice(record)}
            okText="حذف"
            cancelText="إلغاء"
          >
            <Button className="btn-action btn-delete" icon={<DeleteOutlined />}>
              حذف
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="app-page-header">
        <h2 style={{ margin: 0 }}>🤝 فواتير التجار</h2>
        <Button
          type="primary"
          className="btn-add"
          icon={<PlusOutlined />}
          onClick={() => {
            setCartItems([]);
            setPaidAmount(0);
            setModalOpen(true);
          }}
        >
          فاتورة تاجر جديدة
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

      {/* Modal فاتورة جديدة */}
      <Modal
        title="فاتورة تاجر جديدة"
        open={modalOpen}
        onOk={handleSaveInvoice}
        onCancel={() => setModalOpen(false)}
        okText="حفظ"
        cancelText="إلغاء"
        width={750}
      >
        <Divider>بيانات التاجر</Divider>
        <Space style={{ width: "100%", marginBottom: 16 }} direction="vertical">
          <Input
            placeholder="اسم التاجر *"
            value={traderName}
            onChange={(e) => setTraderName(e.target.value)}
          />
          <Input
            placeholder="رقم التليفون"
            value={traderPhone}
            onChange={(e) => setTraderPhone(e.target.value)}
          />
        </Space>

        <Divider>المنتجات</Divider>
        <AutoComplete
          style={{ width: "100%", marginBottom: 16 }}
          options={productOptions}
          onSearch={handleProductSearch}
          onSelect={handleProductSelect}
          value={searchProduct}
          placeholder="🔍 ابحث عن منتج..."
        />

        {cartItems.length > 0 && (
          <Table
            dataSource={cartItems}
            rowKey="product_id"
            pagination={false}
            size="small"
            columns={[
              { title: "المنتج", dataIndex: "product_name" },
              { title: "المقاس", dataIndex: "product_size" },
              {
                title: "الكمية",
                key: "qty",
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

        <Divider>الدفع</Divider>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            الإجمالي: <strong>{totalAmount} ج</strong>
          </div>
          <InputNumber
            style={{ width: "100%" }}
            placeholder="المبلغ المدفوع"
            min={0}
            max={totalAmount}
            value={paidAmount}
            onChange={(v) => setPaidAmount(v || 0)}
            formatter={(v) => `${v} ج`}
          />
          <div>
            المتبقي:{" "}
            <strong
              style={{ color: totalAmount - paidAmount > 0 ? "red" : "green" }}
            >
              {totalAmount - paidAmount} ج
            </strong>
          </div>
        </Space>
      </Modal>

      <Modal
        title={`تعديل فاتورة تاجر #${editingInvoice?.invoice_number || ""}`}
        open={editModalOpen}
        onOk={handleSaveEditedInvoice}
        onCancel={() => setEditModalOpen(false)}
        okText="حفظ التعديل"
        cancelText="إلغاء"
        width={750}
      >
        <Divider>بيانات التاجر</Divider>
        <Space style={{ width: "100%", marginBottom: 16 }} direction="vertical">
          <Input
            placeholder="اسم التاجر *"
            value={editTraderName}
            onChange={(e) => setEditTraderName(e.target.value)}
          />
          <Input
            placeholder="رقم التليفون"
            value={editTraderPhone}
            onChange={(e) => setEditTraderPhone(e.target.value)}
          />
        </Space>

        <Divider>المنتجات</Divider>
        <AutoComplete
          style={{ width: "100%", marginBottom: 16 }}
          options={editProductOptions}
          onSearch={handleEditProductSearch}
          onSelect={handleEditProductSelect}
          value={editSearchProduct}
          placeholder="🔍 ابحث عن منتج..."
        />

        {editCartItems.length > 0 && (
          <Table
            dataSource={editCartItems}
            rowKey="product_id"
            pagination={false}
            size="small"
            columns={[
              { title: "المنتج", dataIndex: "product_name" },
              { title: "المقاس", dataIndex: "product_size" },
              {
                title: "الكمية",
                key: "qty",
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

      {/* Modal تسجيل دفعة */}
      <Modal
        title={`تسجيل دفعة - فاتورة #${selectedInvoice?.invoice_number}`}
        open={paymentModalOpen}
        onOk={handleAddPayment}
        onCancel={() => setPaymentModalOpen(false)}
        okText="تسجيل"
        cancelText="إلغاء"
      >
        {selectedInvoice && (
          <Space direction="vertical" style={{ width: "100%", marginTop: 16 }}>
            <div>
              المتبقي:{" "}
              <strong style={{ color: "red" }}>
                {selectedInvoice.remaining_amount} ج
              </strong>
            </div>
            <InputNumber
              style={{ width: "100%" }}
              placeholder="المبلغ"
              min={1}
              max={selectedInvoice.remaining_amount}
              value={paymentAmount}
              onChange={(v) => setPaymentAmount(v)}
              formatter={(v) => `${v} ج`}
            />
          </Space>
        )}
      </Modal>

      {/* Modal التفاصيل */}
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
        width={650}
      >
        {selectedInvoice && (
          <>
            <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="التاجر" span={3}>
                {selectedInvoice.traders?.name}
              </Descriptions.Item>
              <Descriptions.Item label="التاريخ" span={3}>
                {new Date(selectedInvoice.created_at).toLocaleString("ar-EG")}
              </Descriptions.Item>
              <Descriptions.Item label="الإجمالي">
                {selectedInvoice.total_amount} ج
              </Descriptions.Item>
              <Descriptions.Item label="المدفوع">
                {selectedInvoice.paid_amount} ج
              </Descriptions.Item>
              <Descriptions.Item label="المتبقي">
                <span
                  style={{
                    color:
                      selectedInvoice.remaining_amount > 0 ? "red" : "green",
                  }}
                >
                  {selectedInvoice.remaining_amount} ج
                </span>
              </Descriptions.Item>
            </Descriptions>

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

            {selectedInvoice.payments?.length > 0 && (
              <>
                <Divider>سجل الدفعات</Divider>
                <Table
                  dataSource={selectedInvoice.payments}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: "التاريخ",
                      dataIndex: "payment_date",
                      render: (v) => new Date(v).toLocaleString("ar-EG"),
                    },
                    {
                      title: "المبلغ",
                      dataIndex: "amount",
                      render: (v) => `${v} ج`,
                    },
                    { title: "ملاحظات", dataIndex: "notes" },
                  ]}
                />
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
