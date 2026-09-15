import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getSortingRoomDashboard } from "../api.js";
import { Kpi, Panel, fmtNum } from "../components/ui.jsx";

const GRADE_COLORS = ["var(--series-1)", "var(--series-2)", "var(--warning)", "var(--good)", "var(--critical)"];

export default function SortingRoomPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ product: "", from: "", to: "" });

  useEffect(() => {
    setError(null);
    getSortingRoomDashboard(filters).then(setData).catch((e) => setError(e.message));
  }, [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="muted">Loading…</div>;

  const s = data.summary;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Sorting Room — Lot Detail</h1>
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
          <label className="field-inline"><span>From</span><input type="date" value={filters.from} onChange={set("from")} /></label>
          <label className="field-inline"><span>To</span><input type="date" value={filters.to} onChange={set("to")} /></label>
          <button className="btn-ghost" onClick={() => setFilters({ product: "", from: "", to: "" })}>Clear</button>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label="Total lots" value={fmtNum(s.totalRecords)} />
        <Kpi label="Total weight (kg)" value={fmtNum(s.totalWeightKg)} />
        <Kpi label="Graded weight (kg)" value={fmtNum(s.totalGradeWeightKg)} />
        <Kpi label="Foreign objects" value={`${s.foreignPercent}%`} tone={s.foreignPercent > 2 ? "warn" : "good"} />
        <Kpi label="Man-hours" value={fmtNum(s.totalWorkingHours)} />
        <Kpi label="Avg staff / lot" value={fmtNum(s.avgEmployees, 1)} />
      </div>

      <Panel title="Grade composition (total kg)">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.gradeBreakdown} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="grade" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
            <YAxis tickLine={false} axisLine={false} width={54} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${fmtNum(v)} kg`, "Weight"]} />
            <Bar dataKey="weightKg" name="Weight" radius={[3, 3, 0, 0]}>
              {data.gradeBreakdown.map((g, i) => (
                <Cell key={g.grade} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Grade weight by lot date">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.gradeTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
            <YAxis tickLine={false} axisLine={false} width={54} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v, n) => [`${fmtNum(v)} kg`, n]} />
            <Legend iconType="circle" />
            {data.gradeLabels.map((g, i) => (
              <Bar key={g} dataKey={g} name={`Grade ${g}`} stackId="grade" fill={GRADE_COLORS[i % GRADE_COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Summary by product">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th><th className="num">Lots</th>
                <th className="num">Total weight (kg)</th><th className="num">Foreign %</th>
              </tr>
            </thead>
            <tbody>
              {data.byProduct.map((p) => (
                <tr key={p.product}>
                  <td>{p.product}</td>
                  <td className="num">{p.records}</td>
                  <td className="num">{fmtNum(p.totalWeightKg)}</td>
                  <td className="num">{p.foreignPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Recent lots">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lot date</th><th>Product</th><th>Supplier</th><th>Order</th>
                <th className="num">Weight (kg)</th><th className="num">Foreign (kg)</th>
                <th className="num">Staff</th><th className="num">Hours</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.map((r) => (
                <tr key={r.recordId}>
                  <td>{r.lotDate}</td>
                  <td>{r.productName}</td>
                  <td>{r.supplier}</td>
                  <td>{r.orderName || "—"}</td>
                  <td className="num">{fmtNum(r.totalWeightKg)}</td>
                  <td className="num">{fmtNum(r.totalForeignWeightKg)}</td>
                  <td className="num">{r.employeeCount}</td>
                  <td className="num">{r.totalWorkingHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
