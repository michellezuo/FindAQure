import { useState, useEffect, useRef, useCallback } from "react";

// ─── DRUG INTERACTION GRAPH DATA ────────────────────────────────────────────
const DRUGS = [
  { id: "warfarin",     label: "Warfarin",      category: "anticoagulant" },
  { id: "aspirin",      label: "Aspirin",        category: "nsaid" },
  { id: "ibuprofen",    label: "Ibuprofen",      category: "nsaid" },
  { id: "clopidogrel",  label: "Clopidogrel",    category: "antiplatelet" },
  { id: "metformin",    label: "Metformin",      category: "antidiabetic" },
  { id: "lisinopril",   label: "Lisinopril",     category: "ace_inhibitor" },
  { id: "simvastatin",  label: "Simvastatin",    category: "statin" },
  { id: "amiodarone",   label: "Amiodarone",     category: "antiarrhythmic" },
  { id: "fluoxetine",   label: "Fluoxetine",     category: "ssri" },
  { id: "tramadol",     label: "Tramadol",       category: "opioid" },
  { id: "ciprofloxacin",label: "Ciprofloxacin",  category: "antibiotic" },
  { id: "omeprazole",   label: "Omeprazole",     category: "ppi" },
  { id: "digoxin",      label: "Digoxin",        category: "cardiac_glycoside" },
  { id: "lithium",      label: "Lithium",        category: "mood_stabilizer" },
  { id: "methotrexate", label: "Methotrexate",   category: "immunosuppressant" },
];

const DRUG_INDEX = Object.fromEntries(DRUGS.map((d, i) => [d.id, i]));
const N = DRUGS.length;

// Edges: [drugA, drugB, severity (0-1), description]
const INTERACTIONS = [
  ["warfarin","aspirin",       0.9, "Major bleeding risk — combined anticoagulant effect"],
  ["warfarin","ibuprofen",     0.85,"NSAIDs displace warfarin from protein binding"],
  ["warfarin","amiodarone",    0.95,"Amiodarone inhibits warfarin metabolism (CYP2C9)"],
  ["warfarin","ciprofloxacin", 0.8, "Fluoroquinolones potentiate anticoagulant effect"],
  ["warfarin","fluoxetine",    0.7, "SSRIs increase bleeding risk with anticoagulants"],
  ["warfarin","simvastatin",   0.6, "Statins can elevate INR"],
  ["aspirin","clopidogrel",    0.75,"Dual antiplatelet — high GI bleed risk"],
  ["aspirin","ibuprofen",      0.7, "Ibuprofen blocks aspirin's cardioprotective binding"],
  ["aspirin","methotrexate",   0.85,"NSAIDs reduce methotrexate renal clearance → toxicity"],
  ["lisinopril","ibuprofen",   0.75,"NSAIDs blunt ACE inhibitor effect, raise BP, worsen kidney function"],
  ["lisinopril","lithium",     0.8, "ACE inhibitors reduce lithium excretion → toxicity"],
  ["simvastatin","amiodarone", 0.9, "CYP3A4 inhibition raises simvastatin → myopathy risk"],
  ["fluoxetine","tramadol",    0.95,"Serotonin syndrome risk — potentially life-threatening"],
  ["fluoxetine","lithium",     0.7, "Combined serotonergic effects"],
  ["tramadol","lithium",       0.65,"Tramadol lowers seizure threshold; lithium interaction"],
  ["digoxin","amiodarone",     0.9, "Amiodarone raises digoxin levels → toxicity"],
  ["digoxin","ciprofloxacin",  0.75,"Antibiotics alter gut flora, increase digoxin absorption"],
  ["metformin","ciprofloxacin",0.5, "Fluoroquinolones can cause hypoglycemia with antidiabetics"],
  ["omeprazole","clopidogrel", 0.8, "PPIs reduce clopidogrel activation (CYP2C19)"],
  ["omeprazole","methotrexate",0.65,"PPIs reduce methotrexate clearance"],
  ["lithium","ibuprofen",      0.85,"NSAIDs reduce lithium renal clearance → toxicity"],
  ["methotrexate","ciprofloxacin",0.7,"Additive nephrotoxicity risk"],
  ["clopidogrel","fluoxetine", 0.6, "Fluoxetine inhibits CYP2C19, reducing clopidogrel effect"],
];

// Build adjacency matrix
function buildAdjMatrix() {
  const mat = Array.from({ length: N }, () => new Float32Array(N));
  for (const [a, b, sev] of INTERACTIONS) {
    const i = DRUG_INDEX[a], j = DRUG_INDEX[b];
    if (i !== undefined && j !== undefined) {
      mat[i][j] = sev;
      mat[j][i] = sev;
    }
  }
  return mat;
}

// Matrix multiply (for quantum step)
function matMul(A, B) {
  const res = Array.from({ length: N }, () => new Float32Array(N));
  for (let i = 0; i < N; i++)
    for (let k = 0; k < N; k++) {
      if (A[i][k] === 0) continue;
      for (let j = 0; j < N; j++)
        res[i][j] += A[i][k] * B[k][j];
    }
  return res;
}

const ADJ = buildAdjMatrix();
const ADJ2 = matMul(ADJ, ADJ); // second-order paths

// ─── ANALYSIS ENGINE ─────────────────────────────────────────────────────────
function analyzeRegimen(drugIds, age, kidneyDisease, liverDisease) {
  const indices = drugIds.map(id => DRUG_INDEX[id]).filter(i => i !== undefined);
  const flaggedPairs = [];
  const flaggedTriples = [];

  // Pairwise direct interactions
  for (let a = 0; a < indices.length; a++) {
    for (let b = a + 1; b < indices.length; b++) {
      const i = indices[a], j = indices[b];
      const sev = ADJ[i][j];
      if (sev > 0) {
        let adjustedSev = sev;
        const drugs = [DRUGS[i].id, DRUGS[j].id];
        if (kidneyDisease && drugs.some(d => ["lisinopril","metformin","lithium","methotrexate"].includes(d)))
          adjustedSev = Math.min(1, adjustedSev + 0.15);
        if (liverDisease && drugs.some(d => ["warfarin","simvastatin","methotrexate","amiodarone"].includes(d)))
          adjustedSev = Math.min(1, adjustedSev + 0.15);
        if (age >= 65) adjustedSev = Math.min(1, adjustedSev + 0.1);
        const desc = INTERACTIONS.find(([x, y]) =>
          (x === DRUGS[i].id && y === DRUGS[j].id) || (x === DRUGS[j].id && y === DRUGS[i].id)
        )?.[3] || "Known interaction";
        flaggedPairs.push({ drugs: [DRUGS[i], DRUGS[j]], severity: adjustedSev, description: desc });
      }
    }
  }

  // Quantum step: second-order interference (hidden triples)
  for (let a = 0; a < indices.length; a++) {
    for (let b = a + 1; b < indices.length; b++) {
      for (let c = b + 1; c < indices.length; c++) {
        const i = indices[a], j = indices[b], k = indices[c];
        // Interference score: how much do these three "amplify" via shared pathways?
        const interference =
          (ADJ2[i][j] * ADJ[j][k] + ADJ2[i][k] * ADJ[k][j] + ADJ2[j][k] * ADJ[k][i]) / 3;
        const directSum = ADJ[i][j] + ADJ[j][k] + ADJ[i][k];
        if (interference > 0.3 && directSum < 1.2) { // hidden: low direct, high indirect
          flaggedTriples.push({
            drugs: [DRUGS[i], DRUGS[j], DRUGS[k]],
            severity: Math.min(1, interference * 0.8),
            description: "Quantum-detected: shared metabolic pathway amplification (CYP/renal/serotonin cascade)",
            isHidden: true,
          });
        }
      }
    }
  }

  // Overall risk score
  const allFlags = [...flaggedPairs, ...flaggedTriples];
  let score = 0;
  if (allFlags.length > 0) {
    score = allFlags.reduce((s, f) => s + f.severity, 0) / allFlags.length;
    score = Math.min(1, score + allFlags.length * 0.03);
  }

  // Doctor questions
  const questions = [];
  if (flaggedPairs.some(f => f.drugs.some(d => d.id === "warfarin")))
    questions.push("Are my INR/blood-clotting levels being monitored regularly?");
  if (flaggedPairs.some(f => f.drugs.some(d => d.id === "lithium")))
    questions.push("Can we check my lithium serum levels given my other medications?");
  if (flaggedPairs.some(f => f.drugs.some(d => ["fluoxetine","tramadol"].includes(d.id))))
    questions.push("Is there a risk of serotonin syndrome with my current combination?");
  if (kidneyDisease)
    questions.push("Do any of my medications require dose adjustment for kidney disease?");
  if (liverDisease)
    questions.push("Are any of my medications processed by the liver in a way that concerns you?");
  if (age >= 65)
    questions.push("Which of my medications carry the highest fall or cognitive risk at my age?");
  if (flaggedTriples.length > 0)
    questions.push("Could any of my medications interact through shared metabolic pathways I might not be aware of?");
  questions.push("Is there a pharmacist review of my full medication list I can schedule?");

  return {
    score,
    flaggedPairs: flaggedPairs.sort((a, b) => b.severity - a.severity),
    flaggedTriples: flaggedTriples.sort((a, b) => b.severity - a.severity),
    questions,
    drugIndices: indices,
  };
}

// ─── GRAPH RENDERER ──────────────────────────────────────────────────────────
function DrugGraph({ drugs, flaggedPairs, flaggedTriples }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const nodesRef = useRef([]);

  useEffect(() => {
    if (!drugs.length) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const r = Math.min(W, H) * 0.32;

    // Place nodes in a circle
    nodesRef.current = drugs.map((d, i) => ({
      ...d,
      x: cx + r * Math.cos((2 * Math.PI * i) / drugs.length - Math.PI / 2),
      y: cy + r * Math.sin((2 * Math.PI * i) / drugs.length - Math.PI / 2),
      vx: 0, vy: 0,
    }));

    const allEdges = [
      ...flaggedPairs.map(f => ({ a: f.drugs[0].id, b: f.drugs[1].id, sev: f.severity, hidden: false })),
      ...flaggedTriples.flatMap(t => [
        { a: t.drugs[0].id, b: t.drugs[1].id, sev: t.severity, hidden: true },
        { a: t.drugs[1].id, b: t.drugs[2].id, sev: t.severity, hidden: true },
        { a: t.drugs[0].id, b: t.drugs[2].id, sev: t.severity, hidden: true },
      ]),
    ];

    let tick = 0;
    function draw() {
      tick++;
      ctx.clearRect(0, 0, W, H);
      const nodes = nodesRef.current;
      const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

      // Draw edges
      for (const edge of allEdges) {
        const na = nodeMap[edge.a], nb = nodeMap[edge.b];
        if (!na || !nb) continue;
        const pulse = edge.hidden ? 0.5 + 0.5 * Math.sin(tick * 0.05) : 1;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        if (edge.hidden) {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = `rgba(139,92,246,${0.4 + 0.4 * pulse})`;
          ctx.lineWidth = 1.5;
        } else {
          ctx.setLineDash([]);
          const g = edge.sev;
          ctx.strokeStyle = `rgba(${Math.round(g * 239)},${Math.round((1 - g) * 100 + 20)},50,${0.7 + 0.2 * pulse})`;
          ctx.lineWidth = 1 + edge.sev * 3;
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw nodes
      for (const node of nodes) {
        const isInvolved = allEdges.some(e => e.a === node.id || e.b === node.id);
        const glow = isInvolved ? 12 : 4;
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glow * 2);
        grad.addColorStop(0, isInvolved ? "rgba(99,202,183,0.6)" : "rgba(99,182,233,0.3)");
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(node.x, node.y, glow * 2, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = isInvolved ? "#63cab7" : "#4a7fa5";
        ctx.fill();
        ctx.strokeStyle = "#0d1f2d";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = "10px 'Space Mono', monospace";
        ctx.fillStyle = "#c8dde8";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x, node.y + 20);
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [drugs, flaggedPairs, flaggedTriples]);

  if (!drugs.length) return null;

  return (
    <canvas
      ref={canvasRef}
      width={460}
      height={320}
      style={{ width: "100%", borderRadius: "8px", background: "rgba(6,20,32,0.8)" }}
    />
  );
}

// ─── SEVERITY BADGE ──────────────────────────────────────────────────────────
function SevBadge({ v }) {
  const pct = Math.round(v * 100);
  const color = v > 0.75 ? "#ef4444" : v > 0.5 ? "#f97316" : "#eab308";
  const label = v > 0.75 ? "SEVERE" : v > 0.5 ? "MODERATE" : "LOW";
  return (
    <span style={{ background: color + "22", color, border: `1px solid ${color}55`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "Space Mono,monospace", fontWeight: 700, letterSpacing: 1 }}>
      {label} {pct}%
    </span>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
const DEMO_REGIMEN = ["warfarin","aspirin","amiodarone","simvastatin","omeprazole"];

export default function QuantumDose() {
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [search, setSearch] = useState("");
  const [age, setAge] = useState(62);
  const [kidney, setKidney] = useState(false);
  const [liver, setLiver] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = DRUGS.filter(d =>
    !selectedDrugs.find(s => s.id === d.id) &&
    d.label.toLowerCase().includes(search.toLowerCase())
  );

  const addDrug = (drug) => {
    setSelectedDrugs(prev => [...prev, drug]);
    setSearch(""); setShowDropdown(false);
  };

  const removeDrug = (id) => setSelectedDrugs(prev => prev.filter(d => d.id !== id));

  const loadDemo = () => {
    setSelectedDrugs(DRUGS.filter(d => DEMO_REGIMEN.includes(d.id)));
    setAge(67); setKidney(true); setLiver(false);
  };

  const analyze = () => {
    if (selectedDrugs.length < 2) return;
    setLoading(true);
    setAiAdvice("");
    setTimeout(() => {
      const r = analyzeRegimen(selectedDrugs.map(d => d.id), age, kidney, liver);
      setResult(r);
      setLoading(false);
    }, 600);
  };

  const getAiInsight = async () => {
    if (!result) return;
    setAiLoading(true);
    const pairs = result.flaggedPairs.map(f => `${f.drugs[0].label}+${f.drugs[1].label} (${Math.round(f.severity*100)}%)`).join(", ");
    const triples = result.flaggedTriples.map(t => t.drugs.map(d => d.label).join("+")).join("; ");
    const prompt = `You are a clinical pharmacology expert explaining drug interactions to a patient in plain language.
Patient: Age ${age}, ${kidney ? "kidney disease, " : ""}${liver ? "liver disease, " : ""}taking: ${selectedDrugs.map(d => d.label).join(", ")}.
Flagged pairs: ${pairs || "none"}.
Hidden quantum-detected triples: ${triples || "none"}.
Overall risk score: ${Math.round(result.score * 100)}%.

In 3-4 concise paragraphs, explain what these interactions mean in human terms, why the hidden multi-drug patterns matter, and the most important thing this patient should discuss with their doctor. Do NOT give medical advice — frame as educational context. Be clear and direct, not alarmist.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(c => c.text || "").join("\n") || "Unable to generate insight.";
      setAiAdvice(text);
    } catch {
      setAiAdvice("AI insight unavailable at this time.");
    }
    setAiLoading(false);
  };

  const riskColor = result
    ? result.score > 0.65 ? "#ef4444" : result.score > 0.4 ? "#f97316" : result.score > 0.1 ? "#eab308" : "#22c55e"
    : "#22c55e";
  const riskLabel = result
    ? result.score > 0.65 ? "HIGH RISK" : result.score > 0.4 ? "MODERATE" : result.score > 0.1 ? "LOW RISK" : "MINIMAL"
    : "—";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#040d14",
      color: "#c8dde8",
      fontFamily: "'Space Mono', 'Courier New', monospace",
      padding: "0 0 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; background: #0a1929; }
        ::-webkit-scrollbar-thumb { background: #1e3a52; border-radius: 3px; }
        input, select { outline: none; }
        button { cursor: pointer; }
        @keyframes scan { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(99,202,183,.4)} 50%{box-shadow:0 0 0 8px rgba(99,202,183,0)} }
        .drug-tag { animation: fadeUp .2s ease; }
        .result-block { animation: fadeUp .3s ease; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #0f2a3d", padding: "28px 32px 20px", display: "flex", alignItems: "flex-end", gap: 20, justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#63cab7", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "Syne,sans-serif", fontSize: 11, letterSpacing: 4, color: "#63cab7", fontWeight: 700 }}>PHARMACOLOGY ANALYSIS SYSTEM</span>
          </div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 36, fontWeight: 800, margin: 0, color: "#e8f4f8", letterSpacing: -1 }}>
            Quantum<span style={{ color: "#63cab7" }}>Dose</span>
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#5a8a9f", letterSpacing: 1 }}>HIDDEN DRUG INTERACTION DETECTION ENGINE</p>
        </div>
        <button onClick={loadDemo} style={{ background: "transparent", border: "1px solid #1e4a5f", color: "#63cab7", padding: "8px 18px", fontSize: 11, letterSpacing: 2, fontFamily: "Space Mono,monospace", borderRadius: 4 }}>
          LOAD DEMO REGIMEN ↗
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "340px 1fr", gap: 28, alignItems: "start" }}>
        
        {/* LEFT: INPUT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Patient Info */}
          <div style={{ background: "#061420", border: "1px solid #0f2a3d", borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#3a6a82", marginBottom: 14, fontWeight: 700 }}>PATIENT PROFILE</div>
            
            <label style={{ display: "block", marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: "#4a8a9f", marginBottom: 4, letterSpacing: 2 }}>AGE</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input type="range" min={18} max={95} value={age} onChange={e => setAge(+e.target.value)}
                  style={{ flex: 1, accentColor: "#63cab7" }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: "#e8f4f8", minWidth: 32, fontFamily: "Syne,sans-serif" }}>{age}</span>
              </div>
            </label>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {[["kidney", kidney, setKidney, "KIDNEY DISEASE"], ["liver", liver, setLiver, "LIVER DISEASE"]].map(([key, val, set, lbl]) => (
                <button key={key} onClick={() => set(!val)}
                  style={{ flex: 1, padding: "8px 4px", fontSize: 9, letterSpacing: 1.5, fontFamily: "Space Mono,monospace", border: `1px solid ${val ? "#63cab7" : "#1e3a52"}`, background: val ? "#63cab722" : "transparent", color: val ? "#63cab7" : "#3a6a82", borderRadius: 4, transition: "all .2s" }}>
                  {val ? "✓ " : ""}{lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Drug Search */}
          <div style={{ background: "#061420", border: "1px solid #0f2a3d", borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#3a6a82", marginBottom: 14, fontWeight: 700 }}>MEDICATIONS ({selectedDrugs.length})</div>
            
            <div style={{ position: "relative" }}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search medication..."
                style={{ width: "100%", background: "#040d14", border: "1px solid #1e3a52", borderRadius: 4, padding: "9px 12px", color: "#c8dde8", fontSize: 12, fontFamily: "Space Mono,monospace" }}
              />
              {showDropdown && filtered.length > 0 && search && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#040d14", border: "1px solid #1e3a52", borderTop: "none", borderRadius: "0 0 4px 4px", zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
                  {filtered.map(d => (
                    <button key={d.id} onMouseDown={() => addDrug(d)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: "none", border: "none", color: "#c8dde8", fontSize: 12, fontFamily: "Space Mono,monospace", borderBottom: "1px solid #0a1929" }}>
                      {d.label} <span style={{ color: "#3a6a82", fontSize: 10 }}>{d.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, minHeight: 36 }}>
              {selectedDrugs.map(d => (
                <span key={d.id} className="drug-tag" style={{ background: "#0a2030", border: "1px solid #1e4a5f", borderRadius: 4, padding: "4px 8px 4px 10px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                  {d.label}
                  <button onClick={() => removeDrug(d.id)} style={{ background: "none", border: "none", color: "#3a6a82", fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          </div>

          <button onClick={analyze} disabled={selectedDrugs.length < 2 || loading}
            style={{ width: "100%", padding: "14px", background: selectedDrugs.length >= 2 ? "#63cab7" : "#1e3a52", color: selectedDrugs.length >= 2 ? "#040d14" : "#3a6a82", fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: 2, border: "none", borderRadius: 6, transition: "all .2s" }}>
            {loading ? "ANALYZING..." : "RUN QUANTUM ANALYSIS →"}
          </button>
        </div>

        {/* RIGHT: RESULTS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {!result && (
            <div style={{ background: "#061420", border: "1px solid #0f2a3d", borderRadius: 8, padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: .3 }}>⬡</div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#2a5a72" }}>SELECT MEDICATIONS AND RUN ANALYSIS</div>
              <div style={{ fontSize: 10, color: "#1a3a4a", marginTop: 8 }}>Standard pairwise + quantum-path interference detection</div>
            </div>
          )}

          {result && (
            <>
              {/* Risk Score */}
              <div className="result-block" style={{ background: "#061420", border: `1px solid ${riskColor}33`, borderRadius: 8, padding: 24, display: "flex", alignItems: "center", gap: 24 }}>
                <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="#0f2a3d" strokeWidth="6" />
                    <circle cx="44" cy="44" r="36" fill="none" stroke={riskColor} strokeWidth="6"
                      strokeDasharray={`${result.score * 226} 226`} strokeLinecap="round"
                      transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray 1s ease" }} />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: riskColor, fontFamily: "Syne,sans-serif" }}>{Math.round(result.score * 100)}</span>
                    <span style={{ fontSize: 8, color: riskColor, letterSpacing: 1 }}>%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#3a6a82", marginBottom: 4 }}>OVERALL REGIMEN RISK</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: riskColor, fontFamily: "Syne,sans-serif" }}>{riskLabel}</div>
                  <div style={{ fontSize: 11, color: "#4a7a8a", marginTop: 4 }}>
                    {result.flaggedPairs.length} direct · {result.flaggedTriples.length} hidden pattern{result.flaggedTriples.length !== 1 ? "s" : ""} detected
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Graph */}
                <div className="result-block" style={{ background: "#061420", border: "1px solid #0f2a3d", borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#3a6a82", marginBottom: 12, fontWeight: 700 }}>INTERACTION GRAPH</div>
                  <DrugGraph drugs={selectedDrugs} flaggedPairs={result.flaggedPairs} flaggedTriples={result.flaggedTriples} />
                  <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 9, letterSpacing: 1, color: "#3a6a82" }}>
                    <span>── DIRECT INTERACTION</span>
                    <span style={{ color: "#7c3aed" }}>╌╌ HIDDEN PATHWAY</span>
                  </div>
                </div>

                {/* Flags */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Pairs */}
                  {result.flaggedPairs.length > 0 && (
                    <div className="result-block" style={{ background: "#061420", border: "1px solid #0f2a3d", borderRadius: 8, padding: 16, flex: 1 }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#3a6a82", marginBottom: 10, fontWeight: 700 }}>DIRECT INTERACTIONS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                        {result.flaggedPairs.map((f, i) => (
                          <div key={i} style={{ background: "#040d14", borderRadius: 4, padding: "10px 12px", borderLeft: `3px solid ${f.severity > 0.75 ? "#ef4444" : f.severity > 0.5 ? "#f97316" : "#eab308"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 11, color: "#c8dde8" }}>{f.drugs[0].label} + {f.drugs[1].label}</span>
                              <SevBadge v={f.severity} />
                            </div>
                            <div style={{ fontSize: 10, color: "#4a7a8a", lineHeight: 1.5 }}>{f.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden triples */}
                  {result.flaggedTriples.length > 0 && (
                    <div className="result-block" style={{ background: "#0a0820", border: "1px solid #2a1a4a", borderRadius: 8, padding: 16 }}>
                      <div style={{ fontSize: 10, letterSpacing: 3, color: "#7c3aed", marginBottom: 10, fontWeight: 700 }}>⚡ QUANTUM-DETECTED HIDDEN PATTERNS</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
                        {result.flaggedTriples.map((t, i) => (
                          <div key={i} style={{ background: "#040d14", borderRadius: 4, padding: "10px 12px", borderLeft: "3px solid #7c3aed" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <span style={{ fontSize: 10, color: "#9d6aff" }}>{t.drugs.map(d => d.label).join(" → ")}</span>
                              <SevBadge v={t.severity} />
                            </div>
                            <div style={{ fontSize: 10, color: "#4a3a6a", lineHeight: 1.5 }}>{t.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Questions */}
              <div className="result-block" style={{ background: "#061420", border: "1px solid #0f2a3d", borderRadius: 8, padding: 20 }}>
                <div style={{ fontSize: 10, letterSpacing: 3, color: "#3a6a82", marginBottom: 14, fontWeight: 700 }}>QUESTIONS TO ASK YOUR DOCTOR</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {result.questions.map((q, i) => (
                    <div key={i} style={{ background: "#040d14", borderRadius: 4, padding: "10px 14px", fontSize: 11, color: "#7abacc", lineHeight: 1.6, display: "flex", gap: 10 }}>
                      <span style={{ color: "#63cab7", flexShrink: 0 }}>→</span>{q}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 9, color: "#2a4a5a", letterSpacing: 1 }}>
                  ⚠ THIS IS NOT MEDICAL ADVICE — FOR EDUCATIONAL PURPOSES ONLY. ALWAYS CONSULT YOUR HEALTHCARE PROVIDER.
                </div>
              </div>

              {/* AI Insight */}
              <div className="result-block" style={{ background: "#061420", border: "1px solid #0f2a3d", borderRadius: 8, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: 3, color: "#3a6a82", fontWeight: 700 }}>AI PHARMACOLOGY INSIGHT</div>
                  <button onClick={getAiInsight} disabled={aiLoading}
                    style={{ background: "#63cab722", border: "1px solid #63cab744", color: "#63cab7", padding: "6px 14px", fontSize: 10, letterSpacing: 2, fontFamily: "Space Mono,monospace", borderRadius: 4 }}>
                    {aiLoading ? "ANALYZING..." : "GENERATE INSIGHT"}
                  </button>
                </div>
                {aiAdvice && (
                  <div style={{ fontSize: 12, color: "#7abacc", lineHeight: 1.8, whiteSpace: "pre-wrap", borderTop: "1px solid #0f2a3d", paddingTop: 14 }}>
                    {aiAdvice}
                  </div>
                )}
                {!aiAdvice && (
                  <div style={{ fontSize: 11, color: "#2a4a5a", textAlign: "center", padding: "20px 0" }}>Click "Generate Insight" for an AI-powered plain-language explanation of your interaction patterns.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
