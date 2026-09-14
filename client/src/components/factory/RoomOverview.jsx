import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getFactoryRoom } from "../../api.js";
import { Kpi, Panel, fmtNum, fmtTHB } from "../ui.jsx";

export default function RoomOverview({ room, label, range, showDryingLink }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    getFactoryRoom(room, range).then(setData).catch(() => {});
  }, [room, range]);

  if (!data) return <div className="muted">Loading…</div>;

  return (
    <>
      <Panel
        title={`${label} room — summary by product`}
        right={showDryingLink && <Link className="btn-ghost" to="/factory/dry-room">Drying room detail →</Link>}
      >
        {data.extremes.highest && (
          <div className="kpi-grid" style={{ marginBottom: 8 }}>
            <Kpi label="Total RM in" value={`${fmtNum(data.totals.inputKg)} kg`} />
            <Kpi label="Total output (trimmed)" value={`${fmtNum(data.totals.outputKg)} kg`} />
            <Kpi label="Highest yield" tone="good" accent="var(--good)"
              value={`${data.extremes.highest.product} · ${data.extremes.highest.yieldPercent}%`}
              sub={`${fmtNum(data.extremes.highest.inputKg)} → ${fmtNum(data.extremes.highest.outputKg)} kg`} />
            <Kpi label="Lowest yield" tone="warn" accent="var(--critical)"
              value={`${data.extremes.lowest.product} · ${data.extremes.lowest.yieldPercent}%`}
              sub={`${fmtNum(data.extremes.lowest.inputKg)} → ${fmtNum(data.extremes.lowest.outputKg)} kg`} />
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
              {data.byProduct.map((p) => (
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
                <td className="num">{fmtNum(data.totals.inputKg)}</td>
                <td className="num">{fmtNum(data.totals.outputKg)}</td>
                <td className="num">
                  {data.totals.inputKg ? `${Math.round((data.totals.outputKg / data.totals.inputKg) * 1000) / 10}%` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title={`${label} room — daily log`}>
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
              {data.records.slice(0, 20).map((r, i) => (
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
    </>
  );
}
