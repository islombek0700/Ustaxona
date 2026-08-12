import React, { useState, useEffect, useMemo } from "react";
import { Phone, Trash2, Plus, Search, X, Laptop, RotateCw } from "lucide-react";

const PALETTE = {
  bg: "#191C1A",
  surface: "#232823",
  surfaceRaised: "#2B302B",
  border: "#3A403A",
  text: "#ECE8DE",
  textMuted: "#8B9089",
  amber: "#E8A33D",
  amberDeep: "#412402",
  teal: "#49B9A8",
  tealDeep: "#04342C",
};

const STATUS_ORDER = ["received", "in_repair", "ready", "delivered"];

const STATUS = {
  received: { label: "Qabul qilindi", color: PALETTE.textMuted, bg: "rgba(139,144,137,0.14)" },
  in_repair: { label: "Ta'mirlanmoqda", color: PALETTE.amber, bg: "rgba(232,163,61,0.16)" },
  ready: { label: "Tayyor", color: PALETTE.teal, bg: "rgba(73,185,168,0.16)" },
  delivered: { label: "Topshirildi", color: PALETTE.textMuted, bg: "rgba(139,144,137,0.08)" },
};

const STORAGE_KEY = "tickets-v1";

function makeTicketNo(existing) {
  const nums = existing
    .map((t) => parseInt(String(t.ticketNo).replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `#${String(next).padStart(3, "0")}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("uz-UZ", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
}

export default function App() {
  const [tickets, setTickets] = useState([]);
  const [loadState, setLoadState] = useState("loading");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", device: "", problem: "" });

  useEffect(() => {
    (async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        setTickets(saved ? JSON.parse(saved) : []);
        setLoadState("ready");
      } catch (e) {
        setTickets([]);
        setLoadState("ready");
      }
    })();
  }, []);

  async function persist(next) {
    setTickets(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      setLoadState("error");
    }
  }

  function resetForm() {
    setForm({ name: "", phone: "", device: "", problem: "" });
    setFormError("");
  }

  function handleAdd() {
    if (!form.name.trim() || !form.phone.trim()) {
      setFormError("Ism va telefon raqamini kiriting.");
      return;
    }
    setFormError("");
    const ticket = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ticketNo: makeTicketNo(tickets),
      name: form.name.trim(),
      phone: form.phone.trim(),
      device: form.device.trim(),
      problem: form.problem.trim(),
      status: "received",
      createdAt: new Date().toISOString(),
    };
    const next = [ticket, ...tickets];
    setTickets(next);
    resetForm();
    setFormOpen(false);
    setFilter("all");
    setQuery("");
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setLoadState("ready");
    } catch (e) {
      setLoadState("error");
    } finally {
      setSaving(false);
    }
  }

  async function advanceStatus(id) {
    const next = tickets.map((t) => {
      if (t.id !== id) return t;
      const idx = STATUS_ORDER.indexOf(t.status);
      const nextStatus = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
      return { ...t, status: nextStatus };
    });
    await persist(next);
  }

  async function setStatus(id, status) {
    const next = tickets.map((t) => (t.id === id ? { ...t, status } : t));
    await persist(next);
  }

  async function removeTicket(id) {
    await persist(tickets.filter((t) => t.id !== id));
  }

  const filtered = useMemo(() => {
    let list = tickets;
    if (filter !== "all") list = list.filter((t) => t.status === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.phone.toLowerCase().includes(q) ||
          t.device.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tickets, filter, query]);

  const counts = useMemo(() => {
    const c = { all: tickets.length, received: 0, in_repair: 0, ready: 0, delivered: 0 };
    tickets.forEach((t) => (c[t.status] = (c[t.status] || 0) + 1));
    return c;
  }, [tickets]);

  return (
    <div
      style={{
        background: PALETTE.bg,
        color: PALETTE.text,
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
        ::placeholder { color: ${PALETTE.textMuted}; opacity: 1; }
        .tab-btn { transition: background 0.15s ease, color 0.15s ease; }
        @media (max-width: 560px) {
          .app-wrap { padding: 14px 10px 60px !important; }
          .form-grid { grid-template-columns: 1fr !important; }
          .header-btn { padding: 9px 10px !important; }
          .ticket-actions { width: 100%; justify-content: flex-end; }
          input, textarea, select, button { font-size: 16px !important; }
        }
      `}</style>

      <div className="app-wrap" style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 80px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p className="mono" style={{ fontSize: 11, letterSpacing: "0.14em", color: PALETTE.amber, margin: 0, textTransform: "uppercase" }}>
              Ta'mir jurnali
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "2px 0 0" }}>Ustaxona</h1>
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: formOpen ? PALETTE.surfaceRaised : PALETTE.amber,
              color: formOpen ? PALETTE.text : PALETTE.amberDeep,
              border: "none",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {formOpen ? <X size={16} /> : <Plus size={16} />}
            {formOpen ? "Bekor qilish" : "Yangi buyurtma"}
          </button>
        </header>

        {formOpen && (
          <div
            style={{
              background: PALETTE.surface,
              border: `1px solid ${PALETTE.border}`,
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              display: "grid",
              gap: 10,
            }}
          >
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                placeholder="Mijoz ismi"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder="Telefon raqami"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                style={inputStyle}
              />
            </div>
            <input
              placeholder="Kompyuter / model (masalan: HP Pavilion 15)"
              value={form.device}
              onChange={(e) => setForm({ ...form, device: e.target.value })}
              style={inputStyle}
            />
            <textarea
              placeholder="Muammo tavsifi"
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
            {formError && (
              <p style={{ margin: 0, fontSize: 13, color: "#E24B4A" }}>{formError}</p>
            )}
            <button
              type="button"
              onClick={handleAdd}
              style={{
                justifySelf: "start",
                background: PALETTE.teal,
                color: PALETTE.tealDeep,
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Buyurtmani saqlash
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 12, color: PALETTE.textMuted, pointerEvents: "none" }} />
          <input
            placeholder="Ism, telefon yoki model bo'yicha qidirish"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 36, width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 20, paddingBottom: 2 }}>
          <Tab active={filter === "all"} onClick={() => setFilter("all")} label={`Hammasi (${counts.all})`} />
          {STATUS_ORDER.map((s) => (
            <Tab
              key={s}
              active={filter === s}
              onClick={() => setFilter(s)}
              label={`${STATUS[s].label} (${counts[s] || 0})`}
              color={STATUS[s].color}
            />
          ))}
        </div>

        {loadState === "loading" && (
          <p style={{ color: PALETTE.textMuted, fontSize: 14 }}>Yuklanmoqda...</p>
        )}

        {loadState === "error" && (
          <p style={{ color: "#E24B4A", fontSize: 14 }}>
            Saqlashda xatolik yuz berdi. Internetni tekshirib, qayta urinib ko'ring.
          </p>
        )}

        {loadState === "ready" && filtered.length === 0 && (
          <div
            style={{
              border: `1px dashed ${PALETTE.border}`,
              borderRadius: 14,
              padding: "40px 20px",
              textAlign: "center",
              color: PALETTE.textMuted,
            }}
          >
            <Laptop size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: 14 }}>
              {tickets.length === 0
                ? "Hozircha buyurtmalar yo'q. Birinchi mijozni qo'shing."
                : "Bu bo'yicha hech narsa topilmadi."}
            </p>
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              onAdvance={() => advanceStatus(t.id)}
              onStatusChange={(s) => setStatus(t.id, s)}
              onDelete={() => removeTicket(t.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  background: PALETTE.surfaceRaised,
  border: `1px solid ${PALETTE.border}`,
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 14,
  color: PALETTE.text,
  outline: "none",
};

function Tab({ active, onClick, label, color }) {
  return (
    <button
      className="tab-btn"
      onClick={onClick}
      style={{
        flexShrink: 0,
        border: `1px solid ${active ? (color || PALETTE.amber) : PALETTE.border}`,
        background: active ? (color ? `${color}22` : "rgba(232,163,61,0.14)") : "transparent",
        color: active ? (color || PALETTE.amber) : PALETTE.textMuted,
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function TicketCard({ ticket, onAdvance, onStatusChange, onDelete }) {
  const s = STATUS[ticket.status];
  const isFinal = ticket.status === "delivered";
  const stamped = ticket.status === "ready" || ticket.status === "delivered";

  return (
    <div
      style={{
        position: "relative",
        background: PALETTE.surface,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: 14,
        padding: "16px 18px",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", left: -8, top: 22, width: 16, height: 16, borderRadius: "50%", background: PALETTE.bg }} />

      {stamped && (
        <div
          style={{
            position: "absolute",
            top: 14,
            right: -28,
            transform: "rotate(18deg)",
            border: `2px solid ${s.color}`,
            color: s.color,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            padding: "3px 30px",
            borderRadius: 4,
            opacity: 0.85,
          }}
          className="mono"
        >
          {s.label.toUpperCase()}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, paddingLeft: 10 }}>
        <span className="mono" style={{ fontSize: 12, color: PALETTE.textMuted, letterSpacing: "0.05em" }}>
          {ticket.ticketNo}
        </span>
        {!stamped && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: s.color,
              background: s.bg,
              borderRadius: 999,
              padding: "3px 10px",
            }}
          >
            {s.label}
          </span>
        )}
      </div>

      <div style={{ paddingLeft: 10 }}>
        <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 600 }}>{ticket.name}</p>
        <p className="mono" style={{ margin: "0 0 6px", fontSize: 13, color: PALETTE.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
          <Phone size={12} /> {ticket.phone}
        </p>
        {ticket.device && (
          <p style={{ margin: "0 0 4px", fontSize: 13, color: PALETTE.text, display: "flex", alignItems: "center", gap: 5 }}>
            <Laptop size={13} /> {ticket.device}
          </p>
        )}
        {ticket.problem && (
          <p style={{ margin: "0 0 10px", fontSize: 13, color: PALETTE.textMuted, lineHeight: 1.5 }}>
            {ticket.problem}
          </p>
        )}
      </div>

      <div
        style={{
          borderTop: `1px dashed ${PALETTE.border}`,
          marginTop: 6,
          paddingTop: 10,
          paddingLeft: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: PALETTE.textMuted }}>
          {formatDate(ticket.createdAt)}
        </span>
        <div className="ticket-actions" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange(e.target.value)}
            style={{
              background: PALETTE.surfaceRaised,
              color: PALETTE.text,
              border: `1px solid ${PALETTE.border}`,
              borderRadius: 8,
              fontSize: 12,
              padding: "5px 8px",
            }}
          >
            {STATUS_ORDER.map((k) => (
              <option key={k} value={k}>
                {STATUS[k].label}
              </option>
            ))}
          </select>
          {!isFinal && (
            <button
              onClick={onAdvance}
              title="Keyingi bosqichga o'tkazish"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "transparent",
                border: `1px solid ${PALETTE.border}`,
                color: PALETTE.text,
                borderRadius: 8,
                padding: "5px 8px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <RotateCw size={12} />
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`${ticket.name} (${ticket.ticketNo}) o'chirilsinmi?`)) onDelete();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              background: "transparent",
              border: `1px solid ${PALETTE.border}`,
              color: "#E24B4A",
              borderRadius: 8,
              padding: "5px 8px",
              cursor: "pointer",
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
