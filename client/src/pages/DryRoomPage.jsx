import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import { getDryRoomDashboard } from "../api.js";
import { KpiCard, Panel, fmtNum } from "../components/ui.jsx";

const STATUS_LABEL = { dry_processing: "กำลังอบ", dry_done: "อบเสร็จ" };

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
  if (!data) return <div className="muted">กำลังโหลด…</div>;

  const s = data.summary;

  return (
    <div className="page-dryroom">
      <div className="page-head">
        <div>
          <h1>ห้องอบ · รายละเอียดล็อต</h1>
          {data.source === "mock" && <span className="tag mock">MOCK DATA</span>}
          {" "}<Link className="btn-sm" to="/factory">← กลับหน้าโรงงาน</Link>
        </div>
      </div>

      <section className="filters">
        <label>สินค้า
          <select value={filters.product} onChange={set("product")}>
            <option value="">ทั้งหมด</option>
            {data.products.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>สถานะ
          <select value={filters.status} onChange={set("status")}>
            <option value="">ทั้งหมด</option>
            <option value="dry_processing">กำลังอบ</option>
            <option value="dry_done">อบเสร็จ</option>
          </select>
        </label>
        <label>ตั้งแต่<input type="date" value={filters.from} onChange={set("from")} /></label>
        <label>ถึง<input type="date" value={filters.to} onChange={set("to")} /></label>
        <button className="btn-sm" onClick={() => setFilters({ product: "", status: "", from: "", to: "" })}>ล้าง</button>
      </section>

      <div className="kpi-row">
        <KpiCard label="ล็อตทั้งหมด" value={fmtNum(s.totalBatches)} />
        <KpiCard label="กำลังอบ" value={fmtNum(s.processingBatches)} />
        <KpiCard label="น้ำหนักเข้า (กก.)" value={fmtNum(s.totalInputKg)} />
        <KpiCard label="น้ำหนักออก (กก.)" value={fmtNum(s.totalOutputKg)} />
        <KpiCard label="Yield รวม" value={`${s.overallYieldPercent}%`} tone="good" />
        <KpiCard label="ชั่วโมงงานรวม" value={fmtNum(s.totalWorkingHours)} />
      </div>

      <Panel title="แนวโน้ม Yield ต่อวันล็อต (เฉพาะที่อบเสร็จ)">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.yieldTrend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis unit="%" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n) => (n === "yieldPercent" ? `${v}%` : fmtNum(v))} />
            <Line type="monotone" dataKey="yieldPercent" name="Yield %" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="น้ำหนักเข้า/ออก และ Yield ตามชนิดสินค้า">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={data.byProduct} margin={{ top: 8, right: 16, bottom: 60, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="product" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
            <YAxis yAxisId="kg" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="pct" orientation="right" unit="%" tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v, n) => (n === "Yield %" ? `${v}%` : `${fmtNum(v)} กก.`)} />
            <Legend />
            <Bar yAxisId="kg" dataKey="inputKg" name="เข้า (กก.)" fill="#93c5fd" />
            <Bar yAxisId="kg" dataKey="outputKg" name="ออก (กก.)" fill="#2563eb" />
            <Bar yAxisId="pct" dataKey="yieldPercent" name="Yield %" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="ล็อตล่าสุด">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>วันที่ล็อต</th><th>สินค้า</th><th>สถานะ</th>
                <th className="num">เข้า (กก.)</th><th className="num">ออก (กก.)</th>
                <th className="num">Yield %</th><th className="num">ชม.</th>
              </tr>
            </thead>
            <tbody>
              {data.recentBatches.map((b) => (
                <tr key={b.batchId}>
                  <td>{b.lotDate}</td>
                  <td>{b.productName}</td>
                  <td><span className={`tag ${b.status}`}>{STATUS_LABEL[b.status] || b.status}</span></td>
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
