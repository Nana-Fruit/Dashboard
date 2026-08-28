import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getOfficeSummary, getOfficeOrders, setOfficeTarget } from "../api.js";
import { KpiCard, Progress, TopList, Panel, fmtTHB } from "../components/ui.jsx";

const MONTHS = ["2026-06", "2026-07", "2026-08"];
const MARKET_LABEL = { domestic: "ในประเทศ", international: "ต่างประเทศ" };

export default function OfficePage() {
  const [month, setMonth] = useState("2026-08");
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setError(null);
    getOfficeSummary(month).then(setData).catch((e) => setError(e.message));
    getOfficeOrders({ month }).then(setOrders).catch(() => {});
  }, [month, reload]);

  const trendData = useMemo(
    () => (data?.monthlyTrend || []).map((t) => ({ ...t, current: t.month === month })),
    [data, month]
  );

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="muted">กำลังโหลด…</div>;

  const { overall, byMarket } = data;

  return (
    <div className="page-office">
      <div className="page-head">
        <div>
          <h1>Office · ยอดขาย</h1>
          {data.source === "mock" && <span className="tag mock">MOCK DATA</span>}
        </div>
        <label className="month-pick">
          เดือน
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      {/* headline KPI */}
      <Panel
        title={`เป้าเดือน ${month}`}
        right={data.editable && (
          <button className="btn-sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "ปิด" : "ตั้งเป้า"}
          </button>
        )}
      >
        {editing && <TargetEditor month={month} current={byMarket} onSaved={() => { setEditing(false); setReload((n) => n + 1); }} />}

        <div className="kpi-row">
          <KpiCard label="เป้าทั้งหมด" value={`฿${fmtTHB(overall.target)}`} />
          <KpiCard label="ทำได้แล้ว" value={`฿${fmtTHB(overall.actual)}`} tone="good" />
          <KpiCard
            label="ขาดอีก"
            value={`฿${fmtTHB(overall.remaining)}`}
            tone={overall.remaining > 0 ? "warn" : "good"}
            sub={overall.remaining > 0 ? "จะถึงเป้า" : "ถึงเป้าแล้ว 🎉"}
          />
          <KpiCard label="Achieve" value={`${overall.achievedPercent}%`} />
        </div>
        <Progress percent={overall.achievedPercent} />
      </Panel>

      {/* by market */}
      <div className="two-col">
        {["domestic", "international"].map((mk) => (
          <Panel key={mk} title={MARKET_LABEL[mk]}>
            <div className="kpi-row">
              <KpiCard label="เป้า" value={`฿${fmtTHB(byMarket[mk].target)}`} />
              <KpiCard label="ทำได้" value={`฿${fmtTHB(byMarket[mk].actual)}`} tone="good" />
              <KpiCard label="ขาดอีก" value={`฿${fmtTHB(byMarket[mk].remaining)}`}
                tone={byMarket[mk].remaining > 0 ? "warn" : "good"} />
            </div>
            <Progress percent={byMarket[mk].achievedPercent} />
            <div className="muted sm">{data.orderCount[mk]} ออร์เดอร์</div>
          </Panel>
        ))}
      </div>

      <Panel title="ยอดขายรายเดือน (ในประเทศ / ต่างประเทศ)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1e6}M`} />
            <Tooltip formatter={(v) => `฿${fmtTHB(v)}`} />
            <Legend />
            <Bar dataKey="domestic" name="ในประเทศ" stackId="a" fill="#2563eb" />
            <Bar dataKey="international" name="ต่างประเทศ" stackId="a" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <div className="two-col">
        <TopList title="Top Sales — ในประเทศ" rows={data.topSalesReps.domestic} />
        <TopList title="Top Sales — ต่างประเทศ" rows={data.topSalesReps.international} />
        <TopList title="Top Spender — ในประเทศ" rows={data.topSpenders.domestic} />
        <TopList title="Top Spender — ต่างประเทศ" rows={data.topSpenders.international} />
      </div>

      <Panel title={`ออร์เดอร์เดือน ${month}`}>
        {orders && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>วันที่</th><th>เลขที่</th><th>ลูกค้า</th><th>ตลาด</th><th>ประเทศ</th><th>Sales</th><th className="num">มูลค่า (฿)</th><th>สถานะ</th></tr>
              </thead>
              <tbody>
                {orders.orders.slice(0, 25).map((o) => (
                  <tr key={o.orderId}>
                    <td>{o.orderDate}</td>
                    <td>{o.orderId}</td>
                    <td>{o.customerName}</td>
                    <td><span className={`tag ${o.market}`}>{MARKET_LABEL[o.market]}</span></td>
                    <td>{o.country}</td>
                    <td>{o.salesRep}</td>
                    <td className="num">{fmtTHB(o.amountTHB)}</td>
                    <td>{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function TargetEditor({ month, current, onSaved }) {
  const [dom, setDom] = useState(current.domestic.target);
  const [intl, setIntl] = useState(current.international.target);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await setOfficeTarget({ month, domestic: Number(dom), international: Number(intl) });
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="target-editor">
      <label>เป้าในประเทศ (฿)<input type="number" value={dom} onChange={(e) => setDom(e.target.value)} /></label>
      <label>เป้าต่างประเทศ (฿)<input type="number" value={intl} onChange={(e) => setIntl(e.target.value)} /></label>
      <button className="btn-sm" onClick={save} disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
      {err && <span className="error sm">{err}</span>}
    </div>
  );
}
