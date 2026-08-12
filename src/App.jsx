import React, { useState, useEffect, useRef } from "react";
import {
  Wallet,
  QrCode,
  Copy,
  Check,
  Send,
  Clock3,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const C = {
  paper: "#EDF2F0",
  paperAlt: "#E1E9E6",
  card: "#FFFFFF",
  ink: "#101B22",
  inkSoft: "#54646A",
  inkFaint: "#8B9B9B",
  line: "#CBD8D4",
  teal: "#0B7C74",
  tealDeep: "#075751",
  tealSoft: "#E4F2EF",
  amber: "#DE9F35",
  amberDeep: "#B37F26",
  mint: "#1FA96E",
  mintSoft: "#E4F5EC",
};

const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');";

function genAddress() {
  const chars = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function fmtUSDC(n) {
  const num = parseFloat(n) || 0;
  return num.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function pointOnQuad(p0, p1, p2, t) {
  const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
  const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
  return { x, y };
}

function reducedMotion() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

const P0 = { x: 30, y: 118 };
const P1 = { x: 200, y: 14 };
const P2 = { x: 370, y: 118 };
const PATH_D = `M${P0.x},${P0.y} Q${P1.x},${P1.y} ${P2.x},${P2.y}`;

function BridgeArc({ phase, senderLabel, receiverLabel, onArrived }) {
  const [dot, setDot] = useState(P0);
  const [drawn, setDrawn] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (phase !== "sending") return;
    if (reducedMotion()) {
      setDrawn(1);
      setDot(P2);
      onArrived && onArrived();
      return;
    }
    const start = performance.now();
    const duration = 1500;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeInOutCubic(t);
      setDrawn(eased);
      setDot(pointOnQuad(P0, P1, P2, eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onArrived && onArrived();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === "idle") {
      setDrawn(0);
      setDot(P0);
    }
    if (phase === "paid") {
      setDrawn(1);
      setDot(P2);
    }
  }, [phase]);

  return (
    <div className="w-full">
      <svg viewBox="0 0 400 150" className="w-full h-auto select-none" aria-hidden="true">
        <path d={PATH_D} fill="none" stroke={C.line} strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
        <path
          d={PATH_D}
          fill="none"
          stroke={phase === "paid" ? C.mint : C.teal}
          strokeWidth="3"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - drawn}
          style={{ transition: phase === "idle" ? "stroke-dashoffset 0.3s ease" : "none" }}
        />
        <circle cx={P0.x} cy={P0.y} r="7" fill={C.card} stroke={C.ink} strokeWidth="2.5" />
        <circle
          cx={P2.x}
          cy={P2.y}
          r="7"
          fill={phase === "paid" ? C.mint : C.card}
          stroke={phase === "paid" ? C.mint : C.ink}
          strokeWidth="2.5"
        />
        {(phase === "sending" || phase === "paid") && (
          <circle
            cx={dot.x}
            cy={dot.y}
            r="6.5"
            fill={C.amber}
            stroke={C.amberDeep}
            strokeWidth="1.5"
            opacity={phase === "paid" && drawn >= 1 ? 0 : 1}
            style={{ transition: "opacity 0.25s ease 0.1s" }}
          />
        )}
        <text x={P0.x} y={P0.y + 26} textAnchor="middle" fontSize="11" fontFamily="Manrope" fill={C.inkSoft}>
          {senderLabel}
        </text>
        <text x={P2.x} y={P2.y + 26} textAnchor="middle" fontSize="11" fontFamily="Manrope" fill={C.inkSoft}>
          {receiverLabel}
        </text>
      </svg>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    pending: { bg: C.tealSoft, fg: C.tealDeep, label: "Đang chờ", Icon: Clock3 },
    paid: { bg: C.mintSoft, fg: "#0E7A4B", label: "Đã nhận", Icon: Check },
  };
  const s = map[status];
  const { Icon } = s;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.fg, fontFamily: "Manrope" }}
    >
      <Icon size={13} strokeWidth={2.5} />
      {s.label}
    </span>
  );
}

export default function CauApp() {
  const [address, setAddress] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState(null);
  const [copied, setCopied] = useState(false);
  const [amountError, setAmountError] = useState("");

  const connect = () => setAddress(genAddress());

  const paymentString = (req) =>
    `arc-pay:${address}?amount=${req.amount}&asset=USDC${req.note ? `&note=${encodeURIComponent(req.note)}` : ""}`;

  const qrUrl = (req) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&color=101B22&bgcolor=FFFFFF&data=${encodeURIComponent(
      paymentString(req)
    )}`;

  const createRequest = () => {
    const val = parseFloat(amount);
    if (!amount || isNaN(val) || val <= 0) {
      setAmountError("Nhập số tiền hợp lệ, lớn hơn 0.");
      return;
    }
    setAmountError("");
    const req = {
      id: Date.now(),
      amount: val,
      note: note.trim(),
      status: "pending",
      phase: "idle",
      createdAt: Date.now(),
      paidAt: null,
    };
    setRequests((r) => [req, ...r]);
    setActive(req);
    setAmount("");
    setNote("");
  };

  const simulatePaid = (id) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, phase: "sending" } : r)));
    setActive((a) => (a && a.id === id ? { ...a, phase: "sending" } : a));
  };

  const markArrived = (id) => {
    const paidAt = Date.now();
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: "paid", phase: "paid", paidAt } : r)));
    setActive((a) => (a && a.id === id ? { ...a, status: "paid", phase: "paid", paidAt } : a));
  };

  const copyLink = (req) => {
    const text = paymentString(req);
    if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    setCopied(req.id);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: C.paper, fontFamily: "Manrope, sans-serif", color: C.ink }}
    >
      <style>{`
        ${FONT_IMPORT}
        .cau-display { font-family: 'Fraunces', serif; }
        .cau-mono { font-family: 'JetBrains Mono', monospace; }
        .cau-focus:focus-visible { outline: 2px solid ${C.teal}; outline-offset: 2px; }
      `}</style>

      <header className="max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.ink }}>
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: `linear-gradient(135deg, ${C.teal}, ${C.amber})` }} />
          </div>
          <span className="cau-display text-xl font-semibold tracking-tight">Cầu</span>
          <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: C.paperAlt, color: C.inkSoft }}>
            Arc testnet
          </span>
        </div>

        {address ? (
          <div className="flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-sm" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <span className="cau-mono text-xs" style={{ color: C.inkSoft }}>{shortAddr(address)}</span>
            <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.mintSoft }}>
              <ShieldCheck size={13} color="#0E7A4B" strokeWidth={2.5} />
            </span>
          </div>
        ) : (
          <button onClick={connect} className="cau-focus flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-[0.98]" style={{ background: C.ink, color: C.paper }}>
            <Wallet size={15} /> Kết nối ví
          </button>
        )}
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 pb-16">
        <section className="pt-6 pb-8">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: C.teal }}>
            Nhận USDC · không cần biết crypto
          </p>
          <h1 className="cau-display text-3xl sm:text-[2.6rem] leading-[1.1] font-medium max-w-2xl">
            Tạo yêu cầu thanh toán, chia sẻ một mã QR — tiền về ví ngay trên Arc.
          </h1>
          <p className="mt-4 max-w-xl text-[15px]" style={{ color: C.inkSoft }}>
            Không hợp đồng thông minh, không phí ẩn. Người trả chỉ quét mã, ký một lần — phí giao dịch cũng được trả bằng USDC.
          </p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-3xl p-6 sm:p-7" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            {!address ? (
              <div className="flex flex-col items-center text-center py-10 gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: C.tealSoft }}>
                  <Wallet size={20} color={C.tealDeep} />
                </div>
                <div>
                  <p className="font-semibold">Kết nối ví Arc trước đã</p>
                  <p className="text-sm mt-1 max-w-xs" style={{ color: C.inkSoft }}>
                    Ví của bạn là nơi USDC sẽ được gửi đến. Bấm nút bên trên để tạo một ví.
                  </p>
                </div>
                <button onClick={connect} className="cau-focus rounded-full px-5 py-2.5 text-sm font-semibold" style={{ background: C.teal, color: "#fff" }}>
                  Kết nối ví ngay
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-5">
                  <span className="cau-display w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: C.ink, color: C.paper }}>1</span>
                  <p className="font-semibold text-sm">Nhập số tiền cần nhận</p>
                </div>

                <label className="block text-xs font-semibold mb-1.5" style={{ color: C.inkSoft }}>Số tiền (USDC)</label>
                <div className="flex items-center rounded-2xl px-4 py-3 mb-1" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
                  <span className="cau-display text-2xl mr-2" style={{ color: C.inkFaint }}>$</span>
                  <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="cau-focus cau-display bg-transparent outline-none w-full text-2xl" />
                </div>
                {amountError && <p className="text-xs mb-2" style={{ color: "#C2410C" }}>{amountError}</p>}

                <label className="block text-xs font-semibold mb-1.5 mt-4" style={{ color: C.inkSoft }}>Ghi chú (không bắt buộc)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Tiền hàng tháng 7" className="cau-focus w-full rounded-2xl px-4 py-3 text-sm outline-none" style={{ background: C.paper, border: `1px solid ${C.line}` }} />

                <button onClick={createRequest} className="cau-focus mt-5 w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-sm transition-transform hover:scale-[1.01] active:scale-[0.99]" style={{ background: C.ink, color: C.paper }}>
                  Tạo yêu cầu thanh toán <ArrowRight size={16} />
                </button>

                <p className="text-xs mt-3 text-center" style={{ color: C.inkFaint }}>
                  Ví nhận: <span className="cau-mono">{shortAddr(address)}</span>
                </p>
              </>
            )}
          </div>

          <div className="rounded-3xl p-6 sm:p-7 flex flex-col" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <div className="flex items-center gap-2 mb-5">
              <span className="cau-display w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: C.ink, color: C.paper }}>2</span>
              <p className="font-semibold text-sm">Chia sẻ mã & theo dõi</p>
            </div>

            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 gap-3">
                <QrCode size={28} color={C.inkFaint} />
                <p className="text-sm max-w-[220px]" style={{ color: C.inkSoft }}>
                  Yêu cầu thanh toán gần nhất sẽ hiện ở đây kèm mã QR.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="cau-display text-3xl">${fmtUSDC(active.amount)}</span>
                  <StatusPill status={active.status} />
                </div>
                {active.note && <p className="text-xs mb-4" style={{ color: C.inkSoft }}>{active.note}</p>}

                <div className="rounded-2xl p-3 mb-4" style={{ background: C.paper, border: `1px solid ${C.line}` }}>
                  <img src={qrUrl(active)} alt="Mã QR thanh toán" width={180} height={180} className="rounded-xl" />
                </div>

                <BridgeArc phase={active.phase} senderLabel="Người gửi" receiverLabel="Bạn" onArrived={() => markArrived(active.id)} />

                <div className="flex gap-2 w-full mt-3">
                  <button onClick={() => copyLink(active)} className="cau-focus flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold" style={{ background: C.paper, border: `1px solid ${C.line}`, color: C.ink }}>
                    {copied === active.id ? <Check size={13} /> : <Copy size={13} />}
                    {copied === active.id ? "Đã sao chép" : "Sao chép liên kết"}
                  </button>
                  {active.status === "pending" && (
                    <button onClick={() => simulatePaid(active.id)} disabled={active.phase === "sending"} className="cau-focus flex-1 flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold disabled:opacity-60" style={{ background: C.teal, color: "#fff" }}>
                      {active.phase === "sending" ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                      {active.phase === "sending" ? "Đang gửi…" : "Mô phỏng đã trả tiền"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {requests.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} color={C.inkFaint} />
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: C.inkFaint }}>Lịch sử yêu cầu ({requests.length})</p>
            </div>
            <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${C.line}` }}>
              {requests.map((r, i) => (
                <button key={r.id} onClick={() => setActive(r)} className="cau-focus w-full flex items-center justify-between px-5 py-4 text-left transition-colors" style={{ background: active && active.id === r.id ? C.tealSoft : C.card, borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}>
                  <div className="flex items-center gap-3">
                    <span className="cau-display text-lg">${fmtUSDC(r.amount)}</span>
                    {r.note && <span className="text-xs hidden sm:inline" style={{ color: C.inkSoft }}>{r.note}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs cau-mono" style={{ color: C.inkFaint }}>{fmtTime(r.createdAt)}</span>
                    <StatusPill status={r.status} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs mt-10 text-center" style={{ color: C.inkFaint }}>
          Chuyển USDC trực tiếp ví-tới-ví trên Arc — không giữ tiền, không smart contract.
        </p>
      </main>
    </div>
  );
}
