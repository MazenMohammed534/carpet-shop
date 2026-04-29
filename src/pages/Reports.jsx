import { useState, useEffect } from "react";
import { Table, DatePicker, Button, Tag, Divider, Modal } from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ShopOutlined,
  WarningOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { supabase } from "../supabaseClient";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

// ── بطاقة إحصائية ──────────────────────────────────────────
function StatCard({ title, value, suffix = "ج", color, icon, sub }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "24px 28px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        borderTop: `4px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "#888",
          fontSize: 13,
        }}
      >
        <span style={{ fontSize: 18, color }}>{icon}</span>
        {title}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1.1 }}>
        {Number(value).toLocaleString("ar-EG")}
        <span
          style={{
            fontSize: 14,
            fontWeight: 400,
            marginRight: 4,
            color: "#aaa",
          }}
        >
          {suffix}
        </span>
      </div>
      {sub && <div style={{ fontSize: 12, color: "#bbb" }}>{sub}</div>}
    </div>
  );
}

// ── تاب بار مخصص ──────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 24,
        background: "#f4f6fa",
        borderRadius: 12,
        padding: 6,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            flex: 1,
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: active === t.key ? 700 : 400,
            fontSize: 14,
            background: active === t.key ? "#fff" : "transparent",
            color: active === t.key ? "#1677ff" : "#666",
            boxShadow: active === t.key ? "0 1px 6px rgba(0,0,0,0.10)" : "none",
            transition: "all .18s",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── الصفحة الرئيسية ─────────────────────────────────────────
export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().startOf("day"),
    dayjs().endOf("day"),
  ]);
  const [activeTab, setActiveTab] = useState("daily");

  useEffect(() => {
    fetchAll();
  }, [dateRange]);

  async function fetchAll() {
    setLoading(true);
    const from = dateRange[0].toISOString();
    const to = dateRange[1].toISOString();

    const { data: inv } = await supabase
      .from("invoices")
      .select(
        `*, invoice_items(*), traders(name), suppliers(name), customers(name)`,
      )
      .gte("created_at", from)
      .lte("created_at", to)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    const { data: prods } = await supabase
      .from("products")
      .select("*")
      .order("name");

    setInvoices(inv || []);
    setProducts(prods || []);
    setLoading(false);
  }

  const customerInvoices = invoices.filter((i) => i.type === "customer");
  const traderInvoices = invoices.filter((i) => i.type === "trader");
  const supplierInvoices = invoices.filter((i) => i.type === "supplier");

  const totalSales =
    customerInvoices.reduce((s, i) => s + i.total_amount, 0) +
    traderInvoices.reduce((s, i) => s + i.total_amount, 0);

  const totalPurchases = supplierInvoices.reduce(
    (s, i) => s + i.total_amount,
    0,
  );

  const totalDebt = traderInvoices.reduce(
    (s, i) => s + (i.remaining_amount || 0),
    0,
  );
  const totalOwed = supplierInvoices.reduce(
    (s, i) => s + (i.remaining_amount || 0),
    0,
  );

  const lowStock = products.filter((p) => p.quantity <= p.min_quantity);

  const profit =
    customerInvoices.reduce(
      (sum, inv) =>
        sum +
        inv.invoice_items.reduce(
          (s, item) =>
            s + (item.unit_price - (item.cost_price || 0)) * item.quantity,
          0,
        ),
      0,
    ) +
    traderInvoices.reduce(
      (sum, inv) =>
        sum +
        inv.invoice_items.reduce(
          (s, item) =>
            s + (item.unit_price - (item.cost_price || 0)) * item.quantity,
          0,
        ),
      0,
    );

  const invoiceColumns = [
    {
      title: "رقم",
      dataIndex: "invoice_number",
      render: (v) => (
        <span style={{ fontWeight: 600, color: "#1677ff" }}>#{v}</span>
      ),
      width: 80,
    },
    {
      title: "النوع",
      dataIndex: "type",
      width: 90,
      render: (v) =>
        v === "customer" ? (
          <Tag color="blue" style={{ borderRadius: 6 }}>
            زبون
          </Tag>
        ) : v === "trader" ? (
          <Tag color="purple" style={{ borderRadius: 6 }}>
            تاجر
          </Tag>
        ) : (
          <Tag color="orange" style={{ borderRadius: 6 }}>
            مورد
          </Tag>
        ),
    },
    {
      title: "الاسم",
      key: "name",
      render: (_, r) =>
        r.customers?.name || r.traders?.name || r.suppliers?.name || "-",
    },
    {
      title: "التاريخ",
      dataIndex: "created_at",
      render: (v) => new Date(v).toLocaleString("ar-EG"),
    },
    {
      title: "الإجمالي",
      dataIndex: "total_amount",
      render: (v) => <span style={{ fontWeight: 600 }}>{v} ج</span>,
    },
    {
      title: "المتبقي",
      dataIndex: "remaining_amount",
      render: (v) =>
        v > 0 ? (
          <Tag color="red" style={{ borderRadius: 6 }}>
            {v} ج
          </Tag>
        ) : (
          <Tag color="green" style={{ borderRadius: 6 }}>
            مسدد ✓
          </Tag>
        ),
    },
    {
      title: "إجراءات",
      key: "actions",
      render: (_, record) => (
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
      ),
    },
  ];

  // ── محتوى التاب اليومي ─────────────────────────────────
  const DailyTab = (
    <div>
      {/* فلتر التاريخ */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: "16px 20px",
          marginBottom: 24,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <CalendarOutlined style={{ color: "#1677ff", fontSize: 16 }} />
        <RangePicker
          value={dateRange}
          onChange={(range) => {
            if (range)
              setDateRange([range[0].startOf("day"), range[1].endOf("day")]);
          }}
          format="DD/MM/YYYY"
        />
        <Button
          onClick={() =>
            setDateRange([dayjs().startOf("day"), dayjs().endOf("day")])
          }
          style={{ borderRadius: 8 }}
        >
          اليوم
        </Button>
        <Button
          onClick={() =>
            setDateRange([dayjs().startOf("week"), dayjs().endOf("week")])
          }
          style={{ borderRadius: 8 }}
        >
          هذا الأسبوع
        </Button>
        <Button
          onClick={() =>
            setDateRange([dayjs().startOf("month"), dayjs().endOf("month")])
          }
          style={{ borderRadius: 8 }}
        >
          هذا الشهر
        </Button>
      </div>

      {/* البطاقات */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          title="إجمالي المبيعات"
          value={totalSales}
          color="#3f8600"
          icon={<ShoppingCartOutlined />}
          sub={`${customerInvoices.length + traderInvoices.length} فاتورة`}
        />
        <StatCard
          title="إجمالي المشتريات"
          value={totalPurchases}
          color="#cf1322"
          icon={<ShopOutlined />}
          sub={`${supplierInvoices.length} فاتورة`}
        />
        <StatCard
          title="الربح التقريبي"
          value={profit}
          color={profit >= 0 ? "#1677ff" : "#cf1322"}
          icon={<DollarOutlined />}
        />
        <StatCard
          title="إجمالي الفواتير"
          value={invoices.length}
          suffix="فاتورة"
          color="#722ed1"
          icon={<FileTextOutlined />}
        />
      </div>

      {/* جدول الفواتير */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 16,
            color: "#333",
          }}
        >
          📋 كل الفواتير في الفترة المحددة
        </div>
        <Table
          columns={invoiceColumns}
          dataSource={invoices}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="middle"
        />
      </div>
    </div>
  );

  // ── محتوى تاب الديون ──────────────────────────────────
  const DebtsTab = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      {/* ديون التجار */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <TeamOutlined style={{ color: "#722ed1" }} /> ديون التجار لينا
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: totalDebt > 0 ? "#cf1322" : "#3f8600",
            }}
          >
            {totalDebt.toLocaleString("ar-EG")} ج
          </div>
        </div>
        <Divider style={{ margin: "12px 0" }} />
        {traderInvoices.filter((i) => i.remaining_amount > 0).length === 0 ? (
          <p
            style={{ color: "#3f8600", textAlign: "center", padding: "20px 0" }}
          >
            ✅ مفيش ديون
          </p>
        ) : (
          <Table
            dataSource={traderInvoices.filter((i) => i.remaining_amount > 0)}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: "التاجر", render: (_, r) => r.traders?.name || "-" },
              {
                title: "فاتورة",
                dataIndex: "invoice_number",
                render: (v) => `#${v}`,
              },
              {
                title: "المتبقي",
                dataIndex: "remaining_amount",
                render: (v) => (
                  <Tag color="red" style={{ borderRadius: 6 }}>
                    {v} ج
                  </Tag>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* اللي علينا للموردين */}
      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            <ShopOutlined style={{ color: "#fa8c16" }} /> اللي علينا للموردين
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: totalOwed > 0 ? "#cf1322" : "#3f8600",
            }}
          >
            {totalOwed.toLocaleString("ar-EG")} ج
          </div>
        </div>
        <Divider style={{ margin: "12px 0" }} />
        {supplierInvoices.filter((i) => i.remaining_amount > 0).length === 0 ? (
          <p
            style={{ color: "#3f8600", textAlign: "center", padding: "20px 0" }}
          >
            ✅ مفيش ديون
          </p>
        ) : (
          <Table
            dataSource={supplierInvoices.filter((i) => i.remaining_amount > 0)}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              { title: "المورد", render: (_, r) => r.suppliers?.name || "-" },
              {
                title: "فاتورة",
                dataIndex: "invoice_number",
                render: (v) => `#${v}`,
              },
              {
                title: "المتبقي",
                dataIndex: "remaining_amount",
                render: (v) => (
                  <Tag color="red" style={{ borderRadius: 6 }}>
                    {v} ج
                  </Tag>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* ملخص الديون */}
      <div
        style={{
          gridColumn: "1 / -1",
          background: "#fff",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
        }}
      >
        <StatCard
          title="إجمالي الديون لينا"
          value={totalDebt}
          color="#722ed1"
          icon={<TeamOutlined />}
        />
        <StatCard
          title="إجمالي اللي علينا"
          value={totalOwed}
          color="#fa8c16"
          icon={<ShopOutlined />}
        />
        <StatCard
          title="صافي الوضع"
          value={totalDebt - totalOwed}
          color={totalDebt - totalOwed >= 0 ? "#3f8600" : "#cf1322"}
          icon={<BarChartOutlined />}
          sub={totalDebt - totalOwed >= 0 ? "لصالحك ✓" : "عليك ✗"}
        />
      </div>
    </div>
  );

  // ── محتوى تاب المخزن ──────────────────────────────────
  const InventoryTab = (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          title="إجمالي الأصناف"
          value={products.length}
          suffix="صنف"
          color="#1677ff"
          icon={<ShopOutlined />}
        />
        <StatCard
          title="مخزون منخفض"
          value={lowStock.length}
          suffix="صنف"
          color="#cf1322"
          icon={<WarningOutlined />}
        />
        <StatCard
          title="المخزون كويس"
          value={products.length - lowStock.length}
          suffix="صنف"
          color="#3f8600"
          icon={<ShopOutlined />}
        />
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 15,
            marginBottom: 16,
          }}
        >
          <WarningOutlined
            style={{ color: lowStock.length > 0 ? "#cf1322" : "#3f8600" }}
          />
          منتجات مخزونها منخفض
        </div>
        {lowStock.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 0",
              color: "#3f8600",
              fontSize: 16,
            }}
          >
            ✅ كل المنتجات مخزونها كويس
          </div>
        ) : (
          <Table
            dataSource={lowStock}
            rowKey="id"
            pagination={false}
            columns={[
              {
                title: "المنتج",
                dataIndex: "name",
                render: (v) => <span style={{ fontWeight: 600 }}>{v}</span>,
              },
              { title: "المقاس", dataIndex: "size" },
              {
                title: "الكمية الحالية",
                dataIndex: "quantity",
                render: (v) => (
                  <Tag color="red" style={{ borderRadius: 6, fontWeight: 700 }}>
                    {v} قطعة
                  </Tag>
                ),
              },
              {
                title: "الحد الأدنى",
                dataIndex: "min_quantity",
                render: (v) => `${v} قطعة`,
              },
              {
                title: "سعر البيع",
                dataIndex: "selling_price",
                render: (v) => <span style={{ fontWeight: 600 }}>{v} ج</span>,
              },
            ]}
          />
        )}
      </div>
    </div>
  );

  const tabs = [
    { key: "daily", label: "📅 التقرير اليومي" },
    { key: "debts", label: "💰 الديون" },
    { key: "inventory", label: "📦 تنبيهات المخزن" },
  ];

  return (
    <div style={{ direction: "rtl" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          📊 التقارير
        </h2>
        <p style={{ color: "#888", marginTop: 4, marginBottom: 0 }}>
          نظرة عامة على المبيعات والمشتريات والديون
        </p>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === "daily" && DailyTab}
      {activeTab === "debts" && DebtsTab}
      {activeTab === "inventory" && InventoryTab}

      <Modal
        title={`تفاصيل فاتورة #${selectedInvoice?.invoice_number || ""}`}
        open={detailsModalOpen}
        onCancel={() => setDetailsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalOpen(false)}>
            إغلاق
          </Button>,
        ]}
        width={720}
      >
        {selectedInvoice && (
          <>
            <p style={{ marginBottom: 8 }}>
              النوع:{" "}
              {selectedInvoice.type === "customer"
                ? "زبون"
                : selectedInvoice.type === "trader"
                  ? "تاجر"
                  : "مورد"}
            </p>
            <p style={{ marginBottom: 8 }}>
              الاسم:{" "}
              {selectedInvoice.customers?.name ||
                selectedInvoice.traders?.name ||
                selectedInvoice.suppliers?.name ||
                "-"}
            </p>
            <p style={{ marginBottom: 16 }}>
              التاريخ:{" "}
              {new Date(selectedInvoice.created_at).toLocaleString("ar-EG")}
            </p>

            <Table
              dataSource={selectedInvoice.invoice_items || []}
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
                  key: "total",
                  render: (_, item) =>
                    `${item.total_price || item.quantity * item.unit_price} ج`,
                },
              ]}
              footer={() => (
                <strong>الإجمالي: {selectedInvoice.total_amount} ج</strong>
              )}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
