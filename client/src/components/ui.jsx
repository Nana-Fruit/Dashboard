// Shared presentational pieces. Number formatting is en-US for an
// international audience; ฿ is used as the currency mark.

const enUS = (n, opts) => (Number(n) || 0).toLocaleString("en-US", opts);

export const fmtTHB = (n) => "฿ " + enUS(n, { maximumFractionDigits: 0 });
export const fmtNum = (n, d = 0) => enUS(n, { maximumFractionDigits: d });
export const fmtCompactTHB = (n) =>
  "฿ " + enUS(n, { notation: "compact", maximumFractionDigits: 1 });

export function Kpi({ label, value, sub, tone, accent, hero }) {
  const cls = ["kpi", hero && "hero", tone && `kpi-${tone}`, accent && "kpi-accent"]
    .filter(Boolean).join(" ");
  return (
    <div className={cls} style={accent ? { "--accent": accent } : undefined}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub != null && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function Progress({ percent, label }) {
  const p = Math.max(0, Math.min(percent, 100));
  const over = percent >= 100;
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill ${over ? "done" : ""}`} style={{ width: `${p}%` }} />
      <span className="progress-text">{label ?? `${fmtNum(percent, 1)}%`}</span>
    </div>
  );
}

// Ranked horizontal bars — identity by label + rank number, magnitude by bar.
export function RankList({ title, rows, accent }) {
  const max = Math.max(1, ...rows.map((r) => r.amountTHB));
  return (
    <div className="ranklist">
      <h3>{title}</h3>
      {rows.length === 0 && <div className="muted sm">No data</div>}
      <ol>
        {rows.map((r, i) => (
          <li key={r.name} style={accent ? { "--accent": accent } : undefined}>
            <span className="rl-rank">{i + 1}</span>
            <div className="rl-body">
              <div className="rl-name">{r.name}</div>
              <div className="rl-track"><span style={{ width: `${(r.amountTHB / max) * 100}%` }} /></div>
            </div>
            <span className="rl-val">{fmtTHB(r.amountTHB)}</span>
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
