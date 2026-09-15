import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getPackingRoomDashboard } from "../api.js";
import { Kpi, Panel, fmtNum } from "../components/ui.jsx";

const DEST_COLORS = ["var(--series-1)", "var(--series-2)", "var(--warning)", "var(--good)", "var(--critical)"];

export default function PackingRoomPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ product: "", destination: "", from: "", to: "" });

  useEffect(() => {
    setError(null);
    getPackingRoomDashboard(filters).then(setData).catch((e) => setError(e.message));
  }, [filters]);

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="muted">Loading…</div>;

  const s = data.summary;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Packing Room — Lot Detail</h1>
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
          <label className="field-inline"><span>Destination</span>
            <select value={filters.destination} onChange={set("destination")}>
              <option value="">All</option>
              {data.destinations.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="field-inline"><span>From</span><input type="date" value={filters.from} onChange={set("from")} /></label>
          <label className="field-inline"><span>To</span><input type="date" value={filters.to} onChange={set("to")} /></label>
          <button className="btn-ghost" onClick={() => setFilters({ product: "", destination: "", from: "", to: "" })}>Clear</button>
        </div>
      </div>

      <div className="kpi-grid">
        <Kpi label="Total lots" value={fmtNum(s.totalRecords)} />
        <Kpi label="Total weight (kg)" value={fmtNum(s.totalWeightKg)} />
        <Kpi label="Bags packed" value={fmtNum(s.totalBagsCount)} />
        <Kpi label="Boxes packed" value={fmtNum(s.totalBoxesCount)} />
        <Kpi label="Man-hours" value={fmtNum(s.totalWorkingHours)} />
        <Kpi label="Avg staff / lot" value={fmtNum(s.avgEmployees, 1)} />
      </div>

      <Panel title="Packed weight trend by lot date">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.weightTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
            <YAxis tickLine={false} axisLine={false} width={54} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${fmtNum(v)} kg`, "Weight"]} />
            <Line type="monotone" dataKey="weightKg" name="Weight" stroke="var(--series-1)" strokeWidth={2} dot={{ r: 2.5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Packed weight by destination">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.byDestination} margin={{ top: 8, right: 16, bottom: 60, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="destination" tickLine={false} axisLine={{ stroke: "var(--axis)" }}
              angle={-20} textAnchor="end" interval={0} />
            <YAxis tickLine={false} axisLine={false} width={54} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${fmtNum(v)} kg`, "Weight"]} />
            <Bar dataKey="weightKg" name="Weight" radius={[3, 3, 0, 0]}>
              {data.byDestination.map((d, i) => (
                <Cell key={d.destination} fill={DEST_COLORS[i % DEST_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Summary by product">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th><th className="num">Lots</th>
                <th className="num">Weight (kg)</th><th className="num">Bags</th><th className="num">Boxes</th>
              </tr>
            </thead>
            <tbody>
              {data.byProduct.map((p) => (
                <tr key={p.product}>
                  <td>{p.product}</td>
                  <td className="num">{p.records}</td>
                  <td className="num">{fmtNum(p.weightKg)}</td>
                  <td className="num">{fmtNum(p.bags)}</td>
                  <td className="num">{fmtNum(p.boxes)}</td>
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
                <th>Lot date</th><th>Product</th><th>Customer</th><th>Destination</th>
                <th>Exp date</th><th className="num">Weight (kg)</th>
                <th className="num">Bags</th><th className="num">Boxes</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRecords.map((r) => (
                <tr key={r.recordId}>
                  <td>{r.lotDate}</td>
                  <td>{r.productName}</td>
                  <td>{r.customer}</td>
                  <td>{r.packingDestination}</td>
                  <td>{r.expDate}</td>
                  <td className="num">{fmtNum(r.totalWeightKg)}</td>
                  <td className="num">{fmtNum(r.totalBagsCount)}</td>
                  <td className="num">{fmtNum(r.totalBoxesCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
