// Small shared presentational pieces.

export const fmtTHB = (n) =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

export const fmtNum = (n, d = 0) =>
  (Number(n) || 0).toLocaleString("th-TH", { maximumFractionDigits: d });

export function KpiCard({ label, value, sub, tone }) {
  return (
    <div className={`kpi ${tone ? `kpi-${tone}` : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub != null && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function Progress({ percent }) {
  const p = Math.max(0, Math.min(percent, 100));
  const over = percent >= 100;
  return (
    <div className="progress">
      <div className={`progress-fill ${over ? "done" : ""}`} style={{ width: `${p}%` }} />
      <span className="progress-text">{fmtNum(percent, 1)}%</span>
    </div>
  );
}

export function TopList({ title, rows, unit = "บาท" }) {
  const max = Math.max(1, ...rows.map((r) => r.amountTHB));
  return (
    <div className="toplist">
      <h3>{title}</h3>
      {rows.length === 0 && <div className="muted">ไม่มีข้อมูล</div>}
      <ol>
        {rows.map((r) => (
          <li key={r.name}>
            <span className="tl-name">{r.name}</span>
            <span className="tl-bar"><span style={{ width: `${(r.amountTHB / max) * 100}%` }} /></span>
            <span className="tl-val">{fmtTHB(r.amountTHB)} {unit}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Panel({ title, right, children }) {
  return (
    <section className="panel">
      {(title || right) && (
        <div className="panel-head">
          <h2>{title}</h2>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
