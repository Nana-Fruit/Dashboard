import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getSortingRoomDashboard } from "../api.js";
import { Kpi, Panel, fmtNum } from "../components/ui.jsx";

const GRADE_COLORS = ["var(--series-1)", "var(--series-2)", "var(--warning)", "var(--good)", "var(--critical)"];

function avg(arr, f) {
  if (!arr.length) return 0;
  return arr.reduce((a, x) => a + (f(x) || 0), 0) / arr.length;
}

function ProductivityChart({ title, kpiValue, kpiUnit, data, dataKey, unit, color }) {
  return (
    <Panel title={title}>
      <Kpi label="Average" value={`${fmtNum(kpiValue, 1)} ${kpiUnit}`} />
      <ResponsiveContainer width="100%" height={220} style={{marginTop: '15px'}}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis dataKey="lotDate" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
          <YAxis tickLine={false} axisLine={false} width={54} />
          <Tooltip
            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            formatter={(v) => [`${fmtNum(v, 1)} ${unit}`, title]}
            labelFormatter={(label, payload) => {
              const p = payload?.[0]?.payload;
              return p ? `${label} — ${p.productName}` : label;
            }}
          />
          <Line type="monotone" dataKey={dataKey} name={title} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

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

      {/* <Panel title="Grade composition (total kg)">
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
      </Panel> */}

      <Panel title="Productivity by lot">
        <ProductivityChart
          title="Output per hour"
          kpiValue={avg(data.productivity, (p) => p.outputPerHourKg)}
          kpiUnit="kg/hr"
          data={data.productivity}
          dataKey="outputPerHourKg"
          unit="kg/hr"
          color="var(--series-1)"
        />
        <ProductivityChart
          title="Output per employee"
          kpiValue={avg(data.productivity, (p) => p.outputPerEmployeeKg)}
          kpiUnit="kg"
          data={data.productivity}
          dataKey="outputPerEmployeeKg"
          unit="kg"
          color="var(--series-2)"
        />
        <ProductivityChart
          title="Labor productivity"
          kpiValue={avg(data.productivity, (p) => p.laborProductivity)}
          kpiUnit="kg/(person·hr)"
          data={data.productivity}
          dataKey="laborProductivity"
          unit="kg/(person·hr)"
          color="var(--warning)"
        />

        <details className="table-collapse">
          <summary>Lot detail ({data.productivity.length} lots)</summary>
          <div className="table-wrap">
            <table id="productivity">
              <thead>
                <tr>
                  <th>Lot date</th><th>Product</th>
                  <th className="num">Weight (kg)</th><th className="num">Hours</th><th className="num">Staff</th>
                  <th className="num">Output/hour</th><th className="num">Output/employee</th><th className="num">Labor productivity</th>
                </tr>
              </thead>
              <tbody>
                {[...data.productivity].reverse().map((p) => (
                  <tr key={p.recordId}>
                    <td>{p.lotDate}</td>
                    <td>{p.productName}</td>
                    <td className="num">{fmtNum(p.totalWeightKg)}</td>
                    <td className="num">{fmtNum(p.totalWorkingHours)}</td>
                    <td className="num">{p.employeeCount}</td>
                    <td className="num">{fmtNum(p.outputPerHourKg, 1)}</td>
                    <td className="num">{fmtNum(p.outputPerEmployeeKg, 1)}</td>
                    <td className="num">{fmtNum(p.laborProductivity, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
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
