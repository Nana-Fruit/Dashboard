import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList,
} from "recharts";
import { getOfficeSummary, setOfficeTarget } from "../api.js";
import { Kpi, Progress, RankList, Panel, fmtTHB, fmtCompactTHB } from "../components/ui.jsx";

const MONTHS = ["2026-06", "2026-07", "2026-08"];
const monthLabel = (m) =>
  new Date(m + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" });

const C = { domestic: "var(--series-1)", international: "var(--series-2)" };

export default function OfficePage() {
  const [month, setMonth] = useState("2026-08");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setError(null);
    getOfficeSummary(month).then(setData).catch((e) => setError(e.message));
  }, [month, reload]);

  const trendData = useMemo(
    () => (data?.monthlyTrend || []).map((t) => ({
      ...t,
      label: new Date(t.month + "-01").toLocaleDateString("en-US", { month: "short" }),
    })),
    [data]
  );

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="muted">Loading…</div>;

  const { overall, byMarket } = data;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Sales Performance</h1>
          <div className="subtitle">
            {monthLabel(month)}
            {data.source === "mock" && <> · <span className="pill mock">Mock data</span></>}
          </div>
        </div>
        <div className="head-tools">
          <label className="field-inline">
            <span>Period</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              {MONTHS.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
          </label>
          {data.editable && (
            <button className="btn-ghost" onClick={() => setEditing((v) => !v)}>
              {editing ? "Cancel" : "Set target"}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <TargetEditor
          month={month}
          current={byMarket}
          onSaved={() => { setEditing(false); setReload((n) => n + 1); }}
        />
      )}

      {/* headline */}
      <div className="kpi-grid">
        <Kpi hero label="Revenue achieved" value={fmtTHB(overall.actual)}
          sub={`of ${fmtTHB(overall.target)} target`} tone="good" />
        <Kpi label="Attainment" value={`${overall.achievedPercent}%`} />
        <Kpi label="Remaining to target"
          value={overall.remaining > 0 ? fmtTHB(overall.remaining) : "Target met"}
          tone={overall.remaining > 0 ? "warn" : "good"} />
      </div>
      <Panel title="Progress to monthly target">
        <Progress percent={overall.achievedPercent} />
      </Panel>

      {/* by market */}
      <div className="grid-2">
        {["domestic", "international"].map((mk) => (
          <Panel key={mk} title={mk === "domestic" ? "Domestic" : "International"}>
            <div className="kpi-grid" style={{ marginBottom: 8 }}>
              <Kpi label="Achieved" value={fmtTHB(byMarket[mk].actual)} accent={C[mk]} />
              <Kpi label="Target" value={fmtTHB(byMarket[mk].target)} />
              <Kpi label="Remaining"
                value={byMarket[mk].remaining > 0 ? fmtTHB(byMarket[mk].remaining) : "—"} />
            </div>
            <Progress percent={byMarket[mk].achievedPercent} />
            <div className="muted sm" style={{ marginTop: 8 }}>
              {data.orderCount[mk]} orders · {byMarket[mk].achievedPercent}% of target
            </div>
          </Panel>
        ))}
      </div>

      {/* trend — single axis (revenue), two stacked series */}
      <Panel title="Monthly revenue — domestic vs international">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendData} margin={{ top: 20, right: 12, left: 4, bottom: 4 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--axis)" }} />
            <YAxis tickLine={false} axisLine={false} width={54}
              tickFormatter={(v) => fmtCompactTHB(v)} />
            <Tooltip
              cursor={{ fill: "var(--surface-2)" }}
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v, n) => [fmtTHB(v), n]}
            />
            <Legend iconType="circle" />
            <Bar dataKey="domestic" name="Domestic" stackId="a" fill={C.domestic} radius={[0, 0, 0, 0]} />
            <Bar dataKey="international" name="International" stackId="a" fill={C.international} radius={[4, 4, 0, 0]}>
              <LabelList dataKey="total" position="top" formatter={fmtCompactTHB}
                style={{ fill: "var(--muted)", fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* top spenders only */}
      <div className="grid-2">
        <Panel title="Top spenders — domestic">
          <RankList title="" rows={data.topSpenders.domestic} accent={C.domestic} />
        </Panel>
        <Panel title="Top spenders — international">
          <RankList title="" rows={data.topSpenders.international} accent={C.international} />
        </Panel>
      </div>
    </div>
  );
}

function TargetEditor({ month, current, onSaved }) {
  const [dom, setDom] = useState(current.domestic.target);
  const [intl, setIntl] = useState(current.international.target);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const save = async () => {
    setBusy(true); setErr(null);
    try {
      await setOfficeTarget({ month, domestic: Number(dom), international: Number(intl) });
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };

  return (
    <div className="editor">
      <label className="field-inline"><span>Domestic target (฿)</span>
        <input type="number" value={dom} onChange={(e) => setDom(e.target.value)} /></label>
      <label className="field-inline"><span>International target (฿)</span>
        <input type="number" value={intl} onChange={(e) => setIntl(e.target.value)} /></label>
      <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save target"}</button>
      {err && <span className="error sm">{err}</span>}
    </div>
  );
}
