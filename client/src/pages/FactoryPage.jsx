import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getFactorySummary, getFactoryRoom, setFactoryLaborRates } from "../api.js";
import { KpiCard, Panel, fmtTHB, fmtNum } from "../components/ui.jsx";

export default function FactoryPage() {
  const [range, setRange] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [fresh, setFresh] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setError(null);
    getFactorySummary(range).then(setData).catch((e) => setError(e.message));
    getFactoryRoom("fresh", range).then(setFresh).catch(() => {});
  }, [range, reload]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="muted">กำลังโหลด…</div>;

  return (
    <div className="page-factory">
      <div className="page-head">
        <div>
          <h1>โรงงาน · ต้นทุน & Yield</h1>
          {data.source === "mock" && <span className="tag mock">MOCK DATA</span>}
        </div>
        <div className="filters-inline">
          <label>ตั้งแต่<input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></label>
          <label>ถึง<input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></label>
          {(range.from || range.to) && <button className="btn-sm" onClick={() => setRange({ from: "", to: "" })}>ล้าง</button>}
        </div>
      </div>

      <div className="kpi-row">
        <KpiCard label="ค่าแรงรวมทุกห้อง" value={`฿${fmtTHB(data.totals.laborCostTHB)}`} tone="warn" />
        <KpiCard label="ชั่วโมงงานรวม" value={fmtNum(data.totals.workingHours)} />
        {data.rooms.map((r) => (
          <KpiCard key={r.room} label={`ค่าแรง ${r.label}`} value={`฿${fmtTHB(r.laborCostTHB)}`}
            sub={`Yield ${r.yieldPercent}%`} />
        ))}
      </div>

      <Panel
        title="ค่าแรงและ Yield แยกตามห้อง"
        right={data.editable && <button className="btn-sm" onClick={() => setEditing((v) => !v)}>{editing ? "ปิด" : "แก้ค่าแรง/ชม."}</button>}
      >
        {editing && <RateEditor rooms={data.rooms} onSaved={() => { setEditing(false); setReload((n) => n + 1); }} />}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.rooms} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="cost" tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <YAxis yAxisId="pct" orientation="right" unit="%" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n) => (n === "Yield %" ? `${v}%` : `฿${fmtTHB(v)}`)} />
            <Legend />
            <Bar yAxisId="cost" dataKey="laborCostTHB" name="ค่าแรง (฿)" fill="#2563eb" />
            <Bar yAxisId="pct" dataKey="yieldPercent" name="Yield %" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ห้อง</th><th className="num">รับเข้า (กก.)</th><th className="num">ออก (กก.)</th>
                <th className="num">Yield %</th><th className="num">พนักงานเฉลี่ย</th>
                <th className="num">ชม.งาน</th><th className="num">฿/ชม.</th><th className="num">ค่าแรง (฿)</th>
              </tr>
            </thead>
            <tbody>
              {data.rooms.map((r) => (
                <tr key={r.room}>
                  <td>{r.label}</td>
                  <td className="num">{fmtNum(r.inputKg)}</td>
                  <td className="num">{fmtNum(r.outputKg)}</td>
                  <td className="num">{r.yieldPercent}%</td>
                  <td className="num">{r.avgEmployees}</td>
                  <td className="num">{fmtNum(r.workingHours)}</td>
                  <td className="num">{r.laborRatePerHour}</td>
                  <td className="num">{fmtTHB(r.laborCostTHB)}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>รวม</td><td /><td /><td /><td />
                <td className="num">{fmtNum(data.totals.workingHours)}</td><td />
                <td className="num">{fmtTHB(data.totals.laborCostTHB)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="ห้องสด — RM รับเข้า / หลังตัดแต่ง / Yield"
        right={<Link className="btn-sm" to="/factory/dry-room">ดูรายละเอียดห้องอบ →</Link>}
      >
        {fresh && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>วันที่</th><th>สินค้า (RM)</th><th className="num">รับเข้า (กก.)</th>
                  <th className="num">หลังตัดแต่ง (กก.)</th><th className="num">Yield %</th>
                  <th className="num">พนักงาน</th><th className="num">ชม.งาน</th><th className="num">ค่าแรง (฿)</th>
                </tr>
              </thead>
              <tbody>
                {fresh.records.slice(0, 25).map((r, i) => (
                  <tr key={i}>
                    <td>{r.date}</td>
                    <td>{r.productName}</td>
                    <td className="num">{fmtNum(r.inputWeightKg)}</td>
                    <td className="num">{fmtNum(r.outputWeightKg)}</td>
                    <td className="num">{r.yieldPercent}%</td>
                    <td className="num">{r.employees}</td>
                    <td className="num">{fmtNum(r.workingHours)}</td>
                    <td className="num">{fmtTHB(r.laborCostTHB)}</td>
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

function RateEditor({ rooms, onSaved }) {
  const [rates, setRates] = useState(Object.fromEntries(rooms.map((r) => [r.room, r.laborRatePerHour])));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try { await setFactoryLaborRates(rates); onSaved(); }
    catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="target-editor">
      {rooms.map((r) => (
        <label key={r.room}>{r.label} (฿/ชม.)
          <input type="number" value={rates[r.room]}
            onChange={(e) => setRates((s) => ({ ...s, [r.room]: e.target.value }))} />
        </label>
      ))}
      <button className="btn-sm" onClick={save} disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
      {err && <span className="error sm">{err}</span>}
    </div>
  );
}
