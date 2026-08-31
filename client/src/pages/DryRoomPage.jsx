import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { getDryRoomDashboard } from "../api.js";
import { Kpi, Panel, fmtNum } from "../components/ui.jsx";

const STATUS_EN = { dry_processing: "Processing", dry_done: "Done" };

export default function DryRoomPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ product: "", status: "", from: "", to: "" });

  useEffect(() => {
    setError(null);
    getDryRoomDashboard(filters).then(setData).catch((e) => setError(e.message));
  }, [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="muted">Loading…</div>;

  const s = data.summary;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Drying Room — Lot Detail</h1>
          <div className="subtitle">
            <Link to="/factory">← Back to Factory</Link>
            {data.source === "mock" && <> · <span className="pill mock">Mock data</span></>}
          </div>
        </div>
        <div className="head-tools filters">
          <label className="field-inline"><span>Product</span>
            <select value={filters.product} onChange={set("product")}>
              <option value="">All</option>
              {data.products.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="field-inline"><span>Status</span>
            <select value={filters.status} onChange={set("status")}>
              <option value="">All</option>
              <option value="dry_processing">Processing</option>
              <option value="dry_done">Done</option>
            </select>
          </label>
          <label className="field-inline"><span>From</span><input type="date" value={filters.from} onChange={set("from")} /></label>
          <label className="field-inline"><span>To</span><input type="date" value={filters.to} onChange={set("to")} /></label>
          <button className="btn-ghost" onClick={() => setFilters({ product: "", status: "", from: "", to: "" })}>Clear</button>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label="Total lots" value={fmtNum(s.totalBatches)} />
        <Kpi label="Processing" value={fmtNum(s.processingBatches)} />
        <Kpi label="Input (kg)" value={fmtNum(s.totalInputKg)} />
        <Kpi label="Output (kg)" value={fmtNum(s.totalOutputKg)} />
        <Kpi label="Overall yield" value={`${s.overallYieldPercent}%`} tone="good" />
        <Kpi label="Man-hours" value={fmtNum(s.totalWorkingHours)} />
      </div>

      <Panel title="Yield trend by lot date (completed lots)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.yieldTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
            <YAxis unit="%" tickLine={false} axisLine={false} width={44} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${v}%`, "Yield"]} />
            <Line type="monotone" dataKey="yieldPercent" name="Yield %" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 2.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Input vs output by product (kg)">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.byProduct} margin={{ top: 8, right: 16, bottom: 60, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="product" tickLine={false} axisLine={{ stroke: "var(--axis)" }}
              angle={-30} textAnchor="end" interval={0} />
            <YAxis tickLine={false} axisLine={false} width={54} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v, n) => [`${fmtNum(v)} kg`, n]} />
            <Legend iconType="circle" />
            <Bar dataKey="inputKg" name="Input" fill="var(--series-1)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="outputKg" name="Output" fill="var(--series-2)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Recent lots">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lot date</th><th>Product</th><th>Status</th>
                <th className="num">Input (kg)</th><th className="num">Output (kg)</th>
                <th className="num">Yield</th><th className="num">Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.recentBatches.map((b) => (
                <tr key={b.batchId}>
                  <td>{b.lotDate}</td>
                  <td>{b.productName}</td>
                  <td><span className={`pill ${b.status}`}>{STATUS_EN[b.status] || b.status}</span></td>
                  <td className="num">{fmtNum(b.inputWeightKg)}</td>
                  <td className="num">{b.totalOutputWeightKg ? fmtNum(b.totalOutputWeightKg) : "—"}</td>
                  <td className="num">{b.yieldPercent ? `${b.yieldPercent}%` : "—"}</td>
                  <td className="num">{b.totalWorkingHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
