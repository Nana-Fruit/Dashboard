import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
} from "recharts";
import { getFactorySummary, getFactoryRoom, setFactoryLaborRates } from "../api.js";
import { Kpi, Panel, fmtTHB, fmtNum, fmtCompactTHB } from "../components/ui.jsx";

const ROOM_EN = { fresh: "Fresh", sorting: "Sorting", drying: "Drying", packing: "Packing" };

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
  if (!data) return <div className="muted">Loading…</div>;

  const rooms = data.rooms.map((r) => ({ ...r, name: ROOM_EN[r.room] }));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Factory — Cost &amp; Yield</h1>
          <div className="subtitle">
            Fresh → Sorting → Drying → Packing
            {data.source === "mock" && <> · <span className="pill mock">Mock data</span></>}
          </div>
        </div>
        <div className="head-tools filters">
          <label className="field-inline"><span>From</span>
            <input type="date" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} /></label>
          <label className="field-inline"><span>To</span>
            <input type="date" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} /></label>
          {(range.from || range.to) && <button className="btn-ghost" onClick={() => setRange({ from: "", to: "" })}>Clear</button>}
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi hero label="Total labor cost — all rooms" value={fmtTHB(data.totals.laborCostTHB)}
          sub={`${fmtNum(data.totals.workingHours)} man-hours`} tone="warn" />
        {rooms.map((r) => (
          <Kpi key={r.room} label={`${r.name} room`} value={fmtTHB(r.laborCostTHB)}
            sub={`Yield ${r.yieldPercent}%`} accent="var(--series-2)" />
        ))}
      </div>

      <div className="grid-2">
        <Panel
          title="Labor cost by room"
          right={data.editable && <button className="btn-ghost" onClick={() => setEditing((v) => !v)}>{editing ? "Cancel" : "Edit rates"}</button>}
        >
          {editing && <RateEditor rooms={rooms} onSaved={() => { setEditing(false); setReload((n) => n + 1); }} />}
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rooms} margin={{ top: 20, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
              <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={fmtCompactTHB} />
              <Tooltip cursor={{ fill: "var(--surface-2)" }}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [fmtTHB(v), "Labor cost"]} />
              <Bar dataKey="laborCostTHB" fill="var(--series-1)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="laborCostTHB" position="top" formatter={fmtCompactTHB}
                  style={{ fill: "var(--muted)", fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Yield by room">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rooms} margin={{ top: 20, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
              <YAxis unit="%" tickLine={false} axisLine={false} width={44} domain={[0, 100]} />
              <Tooltip cursor={{ fill: "var(--surface-2)" }}
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}%`, "Yield"]} />
              <Bar dataKey="yieldPercent" fill="var(--series-2)" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="yieldPercent" position="top" formatter={(v) => `${v}%`}
                  style={{ fill: "var(--muted)", fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Room breakdown">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th><th className="num">Input (kg)</th><th className="num">Output (kg)</th>
                <th className="num">Yield</th><th className="num">Avg staff</th>
                <th className="num">Man-hours</th><th className="num">฿/hr</th><th className="num">Labor cost</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.room}>
                  <td>{r.name}</td>
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
                <td>Total</td><td /><td /><td /><td />
                <td className="num">{fmtNum(data.totals.workingHours)}</td><td />
                <td className="num">{fmtTHB(data.totals.laborCostTHB)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {fresh && (
        <Panel
          title="Fresh room — summary by product"
          right={<Link className="btn-ghost" to="/factory/dry-room">Drying room detail →</Link>}
        >
          {fresh.extremes.highest && (
            <div className="kpi-grid" style={{ marginBottom: 8 }}>
              <Kpi label="Total RM in" value={`${fmtNum(fresh.totals.inputKg)} kg`} />
              <Kpi label="Total output (trimmed)" value={`${fmtNum(fresh.totals.outputKg)} kg`} />
              <Kpi label="Highest yield" tone="good" accent="var(--good)"
                value={`${fresh.extremes.highest.product} · ${fresh.extremes.highest.yieldPercent}%`}
                sub={`${fmtNum(fresh.extremes.highest.inputKg)} → ${fmtNum(fresh.extremes.highest.outputKg)} kg`} />
              <Kpi label="Lowest yield" tone="warn" accent="var(--critical)"
                value={`${fresh.extremes.lowest.product} · ${fresh.extremes.lowest.yieldPercent}%`}
                sub={`${fmtNum(fresh.extremes.lowest.inputKg)} → ${fmtNum(fresh.extremes.lowest.outputKg)} kg`} />
            </div>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th className="num">Lots</th>
                  <th className="num">RM in (kg)</th><th className="num">Output (kg)</th><th className="num">Yield</th>
                </tr>
              </thead>
              <tbody>
                {fresh.byProduct.map((p) => (
                  <tr key={p.product}>
                    <td>{p.product}</td>
                    <td className="num">{p.records}</td>
                    <td className="num">{fmtNum(p.inputKg)}</td>
                    <td className="num">{fmtNum(p.outputKg)}</td>
                    <td className="num">{p.yieldPercent}%</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td>Total</td><td />
                  <td className="num">{fmtNum(fresh.totals.inputKg)}</td>
                  <td className="num">{fmtNum(fresh.totals.outputKg)}</td>
                  <td className="num">
                    {fresh.totals.inputKg ? `${Math.round((fresh.totals.outputKg / fresh.totals.inputKg) * 1000) / 10}%` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {fresh && (
        <Panel title="Fresh room — daily log">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Product (RM)</th><th className="num">RM in (kg)</th>
                  <th className="num">Trimmed (kg)</th><th className="num">Yield</th>
                  <th className="num">Staff</th><th className="num">Man-hours</th><th className="num">Labor cost</th>
                </tr>
              </thead>
              <tbody>
                {fresh.records.slice(0, 20).map((r, i) => (
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
        </Panel>
      )}
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
    <div className="editor">
      {rooms.map((r) => (
        <label key={r.room} className="field-inline"><span>{r.name} (฿/hr)</span>
          <input type="number" value={rates[r.room]}
            onChange={(e) => setRates((s) => ({ ...s, [r.room]: e.target.value }))} />
        </label>
      ))}
      <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save rates"}</button>
      {err && <span className="error sm">{err}</span>}
    </div>
  );
}
