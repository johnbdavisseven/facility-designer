import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Trash2,
  RotateCw,
  Save,
  Plus,
  Minus,
  Circle as CircleIcon,
  Printer,
  Droplet,
  Flame,
  Gauge,
  Factory,
  Layers,
  FileText,
  LayoutGrid,
  Box,
} from "lucide-react";

/* ================================================================
   FACILITY DESIGNER · V1
   ---------------------------------------------------------------
   V1 adds:
   - Expanded equipment library matching BLM SFD conventions
     (2-phase scrubber, LP flare scrubber, gas lift compressor,
      wellhead symbol, FMP / buyback meter symbols, loadouts)
   - Auto-numbered equipment referencing a reference table
   - Identifier field per piece (serial # / tag)
   - Export Preview view: landscape BLM-style page with
       · Title block (scale, N arrow, beneficial use, wells,
         operator, legend, reference table)
       · Plot plan in the center
   - Print targets the Export Preview only
   V2 adds: piping, dimensions, valves.
   ================================================================ */

// ---------- Equipment library ----------
const LIBRARY = [
  {
    category: "Tanks",
    vendor: "Enertech / Viking",
    icon: Droplet,
    items: [
      { type: "tank-oil-500", label: "Oil Tank", detail: `15'-6" x 16' - 500 BBL STEEL`, shape: "circle", diameter: 15.5, tint: "#fb923c", svc: "oil" },
      { type: "tank-oil-400", label: "Oil Tank", detail: `12' x 20' - 400 BBL STEEL`, shape: "circle", diameter: 12, tint: "#fb923c", svc: "oil" },
      { type: "tank-water-500", label: "Water Tank", detail: `15'-6" x 16' - 500 BBL FG`, shape: "circle", diameter: 15.5, tint: "#22d3ee", svc: "water" },
      { type: "tank-water-400", label: "Water Tank", detail: `12' x 20' - 400 BBL FG`, shape: "circle", diameter: 12, tint: "#22d3ee", svc: "water" },
    ],
  },
  {
    category: "Process Vessels",
    vendor: "Enertech / Viking",
    icon: Factory,
    items: [
      { type: "vru", label: "VRU", detail: "Vapor Recovery Unit Skid", shape: "rect", w: 8, h: 20, tint: "#4ade80", svc: "gas" },
      { type: "heater-treater-4x25", label: "Heater Treater", detail: `4' x 25' horizontal`, shape: "rect", w: 4, h: 25, tint: "#ef4444", svc: "treat" },
      { type: "heater-treater-6x30", label: "Heater Treater", detail: `6' x 30' horizontal`, shape: "rect", w: 6, h: 30, tint: "#ef4444", svc: "treat" },
      { type: "sep-3ph-3x10", label: "Horz. 3-PH Separator", detail: `3' x 10'`, shape: "rect", w: 3, h: 10, tint: "#c084fc", svc: "sep" },
      { type: "sep-3ph-4x15", label: "Horz. 3-PH Separator", detail: `4' x 15'`, shape: "rect", w: 4, h: 15, tint: "#c084fc", svc: "sep" },
      { type: "scrubber-2ph", label: "2-Phase Scrubber", detail: `Vertical 2-phase scrubber`, shape: "rect", w: 3, h: 6, tint: "#a78bfa", svc: "sep" },
      { type: "fwko-6x20", label: "FWKO", detail: `6' x 20'`, shape: "rect", w: 6, h: 20, tint: "#818cf8", svc: "sep" },
      { type: "fwko-8x30", label: "FWKO", detail: `8' x 30'`, shape: "rect", w: 8, h: 30, tint: "#818cf8", svc: "sep" },
    ],
  },
  {
    category: "Flare Equipment",
    vendor: "",
    icon: Flame,
    items: [
      { type: "flare-lp-scrubber", label: "LP Flare Scrubber", detail: `Vertical LP scrubber`, shape: "rect", w: 3, h: 6, tint: "#f97316", svc: "flare" },
      { type: "flare-hplp", label: "HP/LP Flare", detail: `Combination HP/LP flare stack`, shape: "rect", w: 4, h: 4, tint: "#f97316", svc: "flare" },
    ],
  },
  {
    category: "Meters — Gas & Flare",
    vendor: "",
    icon: Gauge,
    items: [
      { type: "meter-gas", label: "Gas Meter", detail: "", shape: "meter-gas", w: 3, h: 3, tint: "#9ca3af", svc: "gas" },
      { type: "meter-flare", label: "Flare Meter", detail: "", shape: "meter-gas", w: 3, h: 3, tint: "#9ca3af", svc: "flare" },
    ],
  },
  {
    category: "Meters — Liquid",
    vendor: "",
    icon: Gauge,
    items: [
      { type: "meter-inj", label: "Injection Meter", detail: "", shape: "meter-gas", w: 3, h: 3, tint: "#9ca3af", svc: "water" },
      { type: "meter-fmp", label: "FMP Meter", detail: "", shape: "meter-fmp", w: 3, h: 3, tint: "#9ca3af", svc: "oil" },
      { type: "meter-buyback-b", label: "Buyback Meter (Well A)", detail: "Triangle (filled)", shape: "meter-buyback-filled", w: 3, h: 3, tint: "#eab308", svc: "gas" },
      { type: "meter-buyback-c", label: "Buyback Meter (Well B)", detail: "Triangle (open)", shape: "meter-buyback-open", w: 3, h: 3, tint: "#eab308", svc: "gas" },
    ],
  },
  {
    category: "Wellheads / Loadouts",
    vendor: "",
    icon: CircleIcon,
    items: [
      { type: "wellhead", label: "Wellhead", detail: "", shape: "wellhead", w: 4, h: 4, tint: "#dc2626", svc: "well" },
      { type: "compressor", label: "Gas Lift Compressor", detail: "Compressor skid", shape: "rect", w: 8, h: 14, tint: "#78716c", svc: "gas" },
      { type: "loadout-oil", label: "Oil Loadout", detail: "Truck loadout point", shape: "loadout", w: 4, h: 4, tint: "#fb923c", svc: "oil" },
      { type: "loadout-water", label: "Water Loadout", detail: "Truck loadout point", shape: "loadout", w: 4, h: 4, tint: "#22d3ee", svc: "water" },
    ],
  },
  {
    category: "Containment",
    vendor: "Triple T's Linings",
    icon: Layers,
    items: [
      { type: "liner", label: "Pad Liner", detail: "Proposed pad edge", shape: "rect-dashed", w: 180, h: 140, tint: "#22c55e", svc: "liner", z: -3 },
      { type: "containment", label: "Containment / Skid", detail: "Containment outline", shape: "rect-dashed-thin", w: 80, h: 80, tint: "#fbbf24", svc: "cont", z: -2 },
      { type: "dike", label: "Tank Dike / Berm", detail: "Earthen berm", shape: "rect-dashed", w: 100, h: 60, tint: "#eab308", svc: "dike", z: -1 },
    ],
  },
];

const LIB_BY_TYPE = Object.fromEntries(
  LIBRARY.flatMap((cat) => cat.items.map((i) => [i.type, { ...i, category: cat.category, vendor: cat.vendor }]))
);

const NUMBER_ORDER = [
  "tank-oil-500", "tank-oil-400", "tank-water-500", "tank-water-400",
  "vru",
  "heater-treater-4x25", "heater-treater-6x30",
  "sep-3ph-3x10", "sep-3ph-4x15",
  "scrubber-2ph",
  "fwko-6x20", "fwko-8x30",
  "flare-lp-scrubber", "flare-hplp",
  "meter-gas", "meter-flare",
  "meter-inj", "meter-fmp",
  "meter-buyback-b", "meter-buyback-c",
  "wellhead", "compressor", "loadout-oil", "loadout-water",
];

const NO_REF = new Set(["liner", "containment", "dike"]);

// ---------- Demo data ----------
const DEMO_PROJECT = {
  facilityName: "Buckskin Fed Com 2H / Clydesdale Fed Com 1H",
  operator: "MR NM Operating LLC",
  operatorAddr: "5950 Berkshire Lane, Suite 1000",
  operatorCity: "Dallas, TX 75225",
  preparedBy: "Jayson",
  preparedByCompany: "",
  date: "2026-02-10",
  county: "Eddy County",
  state: "NM",
  strq: "NWSW Section 35; T16S-R27E",
  lat: "32.8786952",
  lng: "-104.2542961",
  scale: `1" = 50'`,
  wells: [
    { name: "Buckskin Fed Com 2H", api: "30-015-53480", lease: "NMNM141395", federalCA: "NMNM106319399" },
    { name: "Clydesdale Fed Com 1H", api: "30-015-53740", lease: "NMNM141394", federalCA: "NMNM106319408" },
  ],
  beneficialUse: [
    { equipment: "Buckskin Engine 1", fuel: "30.62", method: "Manufacturer" },
    { equipment: "Buckskin Engine 2", fuel: "30.62", method: "Manufacturer" },
    { equipment: "Clydesdale Engine 1", fuel: "31.62", method: "Manufacturer" },
    { equipment: "Buckskin Heater Treater", fuel: "9.31*", method: "Manufacturer" },
    { equipment: "Clydesdale Heater Treater", fuel: "9.61*", method: "Manufacturer" },
    { equipment: "Flare Pilot", fuel: "1.87", method: "Manufacturer" },
  ],
  beneficialUseNote: "*Fuel usage when heater treaters are in use. Heater treaters are not currently in use.",
};

const DEMO_EQUIPMENT = [
  { type: "liner", x: 10, y: 10, w: 540, h: 395 },
  { type: "containment", x: 265, y: 70, w: 170, h: 130 },
  { type: "tank-oil-500", x: 275, y: 80, identifier: "75480" },
  { type: "tank-oil-500", x: 310, y: 80, identifier: "75481" },
  { type: "tank-water-500", x: 400, y: 80, identifier: "" },
  { type: "tank-oil-500", x: 275, y: 150, identifier: "75482" },
  { type: "tank-oil-500", x: 310, y: 150, identifier: "75483" },
  { type: "tank-water-500", x: 400, y: 150, identifier: "" },
  { type: "vru", x: 230, y: 120, identifier: "" },
  { type: "heater-treater-6x30", x: 180, y: 110 },
  { type: "heater-treater-6x30", x: 195, y: 110 },
  { type: "sep-3ph-4x15", x: 155, y: 115 },
  { type: "sep-3ph-4x15", x: 165, y: 115 },
  { type: "scrubber-2ph", x: 130, y: 130 },
  { type: "scrubber-2ph", x: 140, y: 130 },
  { type: "flare-lp-scrubber", x: 460, y: 150, identifier: "ART 80314" },
  { type: "flare-hplp", x: 510, y: 160, identifier: "ART 80315" },
  { type: "meter-gas", x: 125, y: 100, identifier: "ART 80316" },
  { type: "meter-flare", x: 130, y: 100, identifier: "ART 80317" },
  { type: "meter-gas", x: 140, y: 100, identifier: "ART 80319" },
  { type: "meter-flare", x: 145, y: 100, identifier: "ART 80318" },
  { type: "meter-inj", x: 100, y: 350, identifier: "19G050501" },
  { type: "meter-inj", x: 110, y: 360, identifier: "19G050401" },
  { type: "meter-fmp", x: 480, y: 340, identifier: "19G050503" },
  { type: "meter-fmp", x: 480, y: 355, identifier: "19G050403" },
  { type: "meter-buyback-c", x: 500, y: 330 },
  { type: "meter-buyback-b", x: 500, y: 370 },
  { type: "compressor", x: 110, y: 260 },
  { type: "compressor", x: 110, y: 285 },
  { type: "compressor", x: 110, y: 310 },
  { type: "wellhead", x: 260, y: 320 },
  { type: "wellhead", x: 260, y: 360 },
  { type: "loadout-oil", x: 320, y: 215, identifier: "Oil Loadout" },
  { type: "loadout-water", x: 400, y: 215, identifier: "Water Loadout" },
];

// ---------- Utility ----------
const uid = () => Math.random().toString(36).slice(2, 10);

function getBox(eq) {
  const spec = LIB_BY_TYPE[eq.type];
  if (!spec) return { w: 5, h: 5 };
  if (spec.shape === "circle") {
    const d = spec.diameter;
    return { w: d, h: d };
  }
  return { w: eq.w ?? spec.w, h: eq.h ?? spec.h };
}

function zOrder(type) {
  const spec = LIB_BY_TYPE[type];
  return spec?.z ?? 0;
}

function assignRefNumbers(equipment) {
  const sorted = equipment
    .map((eq, i) => ({ eq, i }))
    .filter(({ eq }) => !NO_REF.has(eq.type))
    .sort((a, b) => {
      const ai = NUMBER_ORDER.indexOf(a.eq.type);
      const bi = NUMBER_ORDER.indexOf(b.eq.type);
      if (ai !== bi) return ai - bi;
      return a.i - b.i;
    });
  const map = {};
  sorted.forEach(({ eq }, idx) => {
    map[eq.id] = idx + 1;
  });
  return map;
}

// ---------- Equipment SVG ----------
function EquipmentSymbol({ eq, spec, refNum, isSelected, monochrome = false }) {
  const { w, h } = getBox(eq);
  const cx = eq.x + w / 2;
  const cy = eq.y + h / 2;
  const stroke = isSelected ? "#fbbf24" : monochrome ? "#111" : spec.tint;
  const strokeW = isSelected ? 0.6 : monochrome ? 0.35 : 0.3;
  const fill = monochrome ? "#fff" : `${spec.tint}26`;
  const rotTransform = `rotate(${eq.rot || 0} ${cx} ${cy})`;

  let body = null;
  switch (spec.shape) {
    case "circle":
      body = <circle cx={cx} cy={cy} r={w / 2} fill={fill} stroke={stroke} strokeWidth={strokeW} />;
      break;
    case "rect":
      body = <rect x={eq.x} y={eq.y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeW} rx={0.3} />;
      break;
    case "rect-dashed":
      body = <rect x={eq.x} y={eq.y} width={w} height={h} fill="none" stroke={stroke} strokeWidth={strokeW * 1.2} strokeDasharray="1.5 1" rx={0.8} />;
      break;
    case "rect-dashed-thin":
      body = <rect x={eq.x} y={eq.y} width={w} height={h} fill="none" stroke={stroke} strokeWidth={strokeW} strokeDasharray="0.8 0.8" rx={0.3} />;
      break;
    case "wellhead":
      body = (
        <g>
          <circle cx={cx} cy={cy} r={w / 3} fill="none" stroke={stroke} strokeWidth={strokeW * 1.2} />
          <line x1={cx - w / 2} y1={cy} x2={cx + w / 2} y2={cy} stroke={stroke} strokeWidth={strokeW * 1.2} />
          <line x1={cx} y1={cy - h / 2} x2={cx} y2={cy + h / 2} stroke={stroke} strokeWidth={strokeW * 1.2} />
        </g>
      );
      break;
    case "meter-gas":
      body = (
        <g>
          <rect x={eq.x} y={eq.y + h / 4} width={w} height={h / 2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
          <line x1={eq.x + w * 0.2} y1={cy} x2={eq.x + w * 0.8} y2={cy} stroke={stroke} strokeWidth={strokeW * 0.7} />
        </g>
      );
      break;
    case "meter-fmp":
      body = (
        <g>
          <circle cx={cx} cy={cy} r={w / 2} fill={fill} stroke={stroke} strokeWidth={strokeW} />
          <line x1={eq.x + 0.4} y1={eq.y + 0.4} x2={eq.x + w - 0.4} y2={eq.y + h - 0.4} stroke={stroke} strokeWidth={strokeW * 0.8} />
          <line x1={eq.x + w - 0.4} y1={eq.y + 0.4} x2={eq.x + 0.4} y2={eq.y + h - 0.4} stroke={stroke} strokeWidth={strokeW * 0.8} />
        </g>
      );
      break;
    case "meter-buyback-filled":
      body = <polygon points={`${cx},${eq.y} ${eq.x + w},${eq.y + h} ${eq.x},${eq.y + h}`} fill={monochrome ? "#111" : stroke} stroke={stroke} strokeWidth={strokeW} />;
      break;
    case "meter-buyback-open":
      body = <polygon points={`${cx},${eq.y} ${eq.x + w},${eq.y + h} ${eq.x},${eq.y + h}`} fill="none" stroke={stroke} strokeWidth={strokeW} />;
      break;
    case "loadout":
      body = (
        <g>
          <rect x={eq.x} y={eq.y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeW} rx={0.2} />
          <path d={`M ${cx} ${eq.y + 0.6} L ${cx} ${eq.y + h - 0.6} M ${cx - 1} ${eq.y + h - 1.6} L ${cx} ${eq.y + h - 0.6} L ${cx + 1} ${eq.y + h - 1.6}`} fill="none" stroke={stroke} strokeWidth={strokeW * 0.8} />
        </g>
      );
      break;
    default:
      body = <rect x={eq.x} y={eq.y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={strokeW} />;
  }

  const badgeSize = Math.max(1.8, Math.min(w, h) * 0.25);
  const showBadge = refNum != null && !NO_REF.has(eq.type);
  const isContainer = NO_REF.has(eq.type);

  return (
    <g transform={rotTransform}>
      {body}
      {showBadge && (
        <g>
          <circle
            cx={eq.x + 0.3}
            cy={eq.y + 0.3}
            r={badgeSize}
            fill={monochrome ? "#fff" : "#1c1917"}
            stroke={monochrome ? "#111" : "#fbbf24"}
            strokeWidth={0.25}
          />
          <text
            x={eq.x + 0.3}
            y={eq.y + 0.3 + badgeSize * 0.35}
            textAnchor="middle"
            fontSize={badgeSize * 1}
            fill={monochrome ? "#111" : "#fbbf24"}
            fontFamily="ui-sans-serif, system-ui"
            fontWeight="700"
            pointerEvents="none"
          >
            {refNum}
          </text>
        </g>
      )}
      {isContainer && (
        <text
          x={eq.x + 1.5}
          y={eq.y + 3}
          fontSize={2.2}
          fill={monochrome ? "#111" : spec.tint}
          fontFamily="ui-sans-serif, system-ui"
          fontWeight="500"
          pointerEvents="none"
          opacity={0.8}
        >
          {spec.label}
        </text>
      )}
    </g>
  );
}

// ============================================================
// MAIN
// ============================================================
export default function FacilityDesigner() {
  const [view, setView] = useState("editor");
  const [project, setProject] = useState(emptyProject());
  const [equipment, setEquipment] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(2.5);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [savedList, setSavedList] = useState([]);
  const [status, setStatus] = useState("");
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const refNumbers = useMemo(() => assignRefNumbers(equipment), [equipment]);

  useEffect(() => {
    (async () => {
      try {
        const list = await window.storage.list("facility:");
        setSavedList(list?.keys || []);
      } catch (e) { /* noop */ }
    })();
  }, []);

  const selected = equipment.find((e) => e.id === selectedId);

  const clientToFt = useCallback(
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left) / zoom - pan.x / zoom,
        y: (clientY - rect.top) / zoom - pan.y / zoom,
      };
    },
    [zoom, pan]
  );

  const onEqMouseDown = (e, eq) => {
    e.stopPropagation();
    setSelectedId(eq.id);
    const pt = clientToFt(e.clientX, e.clientY);
    dragRef.current = {
      id: eq.id,
      offsetX: pt.x - eq.x,
      offsetY: pt.y - eq.y,
      mode: "move",
    };
  };

  const onCanvasMouseDown = (e) => {
    if (e.target === svgRef.current || (e.target.tagName === "rect" && e.target.getAttribute("fill")?.startsWith("url(#"))) {
      if (e.shiftKey) {
        dragRef.current = {
          mode: "pan",
          startX: e.clientX,
          startY: e.clientY,
          origPan: { ...pan },
        };
      } else {
        setSelectedId(null);
      }
    }
  };

  const onMouseMove = useCallback(
    (e) => {
      const d = dragRef.current;
      if (!d) return;
      if (d.mode === "move") {
        const pt = clientToFt(e.clientX, e.clientY);
        setEquipment((cur) =>
          cur.map((it) =>
            it.id === d.id
              ? { ...it, x: Math.round((pt.x - d.offsetX) * 2) / 2, y: Math.round((pt.y - d.offsetY) * 2) / 2 }
              : it
          )
        );
      } else if (d.mode === "pan") {
        setPan({
          x: d.origPan.x + (e.clientX - d.startX),
          y: d.origPan.y + (e.clientY - d.startY),
        });
      }
    },
    [clientToFt]
  );

  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const onWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom((z) => Math.max(0.5, Math.min(12, z * (1 + delta))));
  };

  const addEquipment = (type) => {
    const spec = LIB_BY_TYPE[type];
    if (!spec) return;
    const id = uid();
    const newItem = {
      id, type,
      x: 80, y: 80,
      w: spec.w, h: spec.h, rot: 0,
      identifier: "", notes: "",
    };
    setEquipment((e) => [...e, newItem]);
    setSelectedId(id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setEquipment((e) => e.filter((it) => it.id !== selectedId));
    setSelectedId(null);
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    setEquipment((e) => e.map((it) => (it.id === selectedId ? { ...it, rot: ((it.rot || 0) + 15) % 360 } : it)));
  };

  const updateSelected = (patch) => {
    if (!selectedId) return;
    setEquipment((e) => e.map((it) => (it.id === selectedId ? { ...it, ...patch } : it)));
  };

  const doSave = async () => {
    try {
      const key = `facility:${project.facilityName.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const payload = JSON.stringify({ project, equipment, zoom, pan });
      await window.storage.set(key, payload);
      const list = await window.storage.list("facility:");
      setSavedList(list?.keys || []);
      setStatus(`Saved "${project.facilityName}"`);
      setTimeout(() => setStatus(""), 2500);
    } catch (e) {
      setStatus("Save failed: " + e.message);
    }
  };

  const doLoad = async (key) => {
    try {
      const res = await window.storage.get(key);
      if (!res) return;
      const data = JSON.parse(res.value);
      setProject(data.project);
      setEquipment(data.equipment);
      if (data.zoom) setZoom(data.zoom);
      if (data.pan) setPan(data.pan);
      setStatus(`Loaded "${data.project.facilityName}"`);
      setTimeout(() => setStatus(""), 2500);
    } catch (e) {
      setStatus("Load failed: " + e.message);
    }
  };

  const doLoadDemo = () => {
    setProject({ ...DEMO_PROJECT });
    setEquipment(DEMO_EQUIPMENT.map((e) => ({ id: uid(), rot: 0, identifier: "", notes: "", ...e })));
    setZoom(1.6);
    setPan({ x: 20, y: 20 });
    setStatus("Demo loaded: Buckskin / Clydesdale");
    setTimeout(() => setStatus(""), 2500);
  };

  const doNew = () => {
    if (!window.confirm("Start a new blank facility? Unsaved changes will be lost.")) return;
    setProject(emptyProject());
    setEquipment([]);
    setSelectedId(null);
  };

  const doPrint = () => {
    setView("preview");
    setTimeout(() => window.print(), 200);
  };

  const refTableRows = useMemo(() => {
    return equipment
      .filter((eq) => !NO_REF.has(eq.type))
      .map((eq) => ({
        id: eq.id,
        num: refNumbers[eq.id],
        type: eq.type,
        spec: LIB_BY_TYPE[eq.type],
        identifier: eq.identifier || "",
        notes: eq.notes || "",
      }))
      .sort((a, b) => (a.num || 999) - (b.num || 999));
  }, [equipment, refNumbers]);

  const legendEntries = useMemo(() => {
    const seen = new Set();
    const entries = [];
    equipment.forEach((eq) => {
      const spec = LIB_BY_TYPE[eq.type];
      if (!spec) return;
      const key = spec.shape + "|" + spec.label;
      if (!seen.has(key)) {
        seen.add(key);
        entries.push({ spec, sample: eq });
      }
    });
    return entries;
  }, [equipment]);

  const sortedForRender = [...equipment].sort((a, b) => zOrder(a.type) - zOrder(b.type));

  return (
    <div className="flex flex-col h-screen bg-stone-950 text-stone-100 overflow-hidden" style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system" }}>
      <style>{`
        @media print {
          @page { size: 17in 11in landscape; margin: 0.3in; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .preview-page { box-shadow: none !important; margin: 0 !important; page-break-after: avoid; }
          html, body, #root { height: auto !important; }
        }
        .print-only { display: none; }
        .scroll-thin::-webkit-scrollbar { width: 7px; height: 7px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #44403c; border-radius: 4px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
        .bg-stone-850 { background-color: #26221e; }
      `}</style>

      <div className="no-print flex items-center gap-3 px-4 py-2 border-b border-stone-800 bg-stone-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 pr-3 border-r border-stone-800">
          <div className="relative">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-black text-sm shadow-lg shadow-amber-900/40">F</div>
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide">FACILITY DESIGNER</div>
            <div className="text-[9px] text-stone-500 uppercase tracking-[0.15em] font-semibold">v1.0 · BLM SFD preview</div>
          </div>
        </div>

        <input
          value={project.facilityName}
          onChange={(e) => setProject({ ...project, facilityName: e.target.value })}
          className="bg-stone-850 border border-stone-700 rounded px-3 py-1.5 text-sm flex-1 max-w-md focus:border-amber-500 focus:bg-stone-900 outline-none transition-colors"
          placeholder="Facility Name"
        />

        <div className="flex rounded border border-stone-700 overflow-hidden text-xs">
          <button
            onClick={() => setView("editor")}
            className={`px-3 py-1.5 inline-flex items-center gap-1 ${view === "editor" ? "bg-amber-600 text-stone-950 font-bold" : "bg-stone-850 hover:bg-stone-800"}`}
          >
            <LayoutGrid size={12} /> Editor
          </button>
          <button
            onClick={() => setView("preview")}
            className={`px-3 py-1.5 inline-flex items-center gap-1 ${view === "preview" ? "bg-amber-600 text-stone-950 font-bold" : "bg-stone-850 hover:bg-stone-800"}`}
          >
            <FileText size={12} /> Export Preview
          </button>
        </div>

        <div className="flex gap-1">
          <button onClick={doLoadDemo} className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wide">Load Demo</button>
          <button onClick={doNew} className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-xs font-semibold">New</button>
          <button onClick={doSave} className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-xs font-semibold inline-flex items-center gap-1.5">
            <Save size={12} /> Save
          </button>
          <select onChange={(e) => e.target.value && doLoad(e.target.value)} className="px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-xs border border-stone-700" value="">
            <option value="">Load…</option>
            {savedList.map((k) => (<option key={k} value={k}>{k.replace("facility:", "")}</option>))}
          </select>
          <button onClick={doPrint} className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold inline-flex items-center gap-1.5">
            <Printer size={12} /> Print / PDF
          </button>
        </div>

        {status && <div className="text-xs text-amber-400 font-semibold animate-pulse ml-2">{status}</div>}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {view === "editor" ? (
          <EditorView
            project={project} setProject={setProject}
            equipment={equipment} selected={selected} selectedId={selectedId} setSelectedId={setSelectedId}
            zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan}
            svgRef={svgRef} dragRef={dragRef}
            onCanvasMouseDown={onCanvasMouseDown} onEqMouseDown={onEqMouseDown} onWheel={onWheel}
            sortedForRender={sortedForRender} refNumbers={refNumbers} refTableRows={refTableRows}
            addEquipment={addEquipment} deleteSelected={deleteSelected} rotateSelected={rotateSelected} updateSelected={updateSelected}
          />
        ) : (
          <PreviewView
            project={project} equipment={equipment}
            refNumbers={refNumbers} refTableRows={refTableRows}
            legendEntries={legendEntries} sortedForRender={sortedForRender}
          />
        )}
      </div>
    </div>
  );
}

function emptyProject() {
  return {
    facilityName: "New Facility",
    operator: "", operatorAddr: "", operatorCity: "",
    preparedBy: "", preparedByCompany: "",
    date: new Date().toISOString().slice(0, 10),
    county: "", state: "",
    strq: "", lat: "", lng: "",
    scale: `1" = 50'`,
    wells: [{ name: "", api: "", lease: "", federalCA: "" }],
    beneficialUse: [],
    beneficialUseNote: "",
  };
}

// ============================================================
// EDITOR
// ============================================================
function EditorView(props) {
  const {
    project, setProject, equipment, selected, selectedId, setSelectedId,
    zoom, setZoom, pan, setPan, svgRef, dragRef, onCanvasMouseDown, onEqMouseDown, onWheel,
    sortedForRender, refNumbers, refTableRows,
    addEquipment, deleteSelected, rotateSelected, updateSelected,
  } = props;

  return (
    <>
      {/* Library sidebar */}
      <div className="w-64 border-r border-stone-800 bg-stone-900 overflow-y-auto scroll-thin">
        <div className="px-3 py-2 border-b border-stone-800 sticky top-0 bg-stone-900 z-10">
          <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500 font-bold">Equipment Library</div>
        </div>
        {LIBRARY.map((cat) => (
          <div key={cat.category} className="border-b border-stone-800">
            <div className="px-3 py-2 bg-stone-850 flex items-center gap-2">
              <cat.icon size={12} className="text-amber-500" />
              <div className="flex-1">
                <div className="text-xs font-bold">{cat.category}</div>
                {cat.vendor && <div className="text-[9px] text-stone-500 uppercase tracking-wider">{cat.vendor}</div>}
              </div>
            </div>
            <div className="p-1 space-y-0.5">
              {cat.items.map((item) => (
                <button
                  key={item.type}
                  onClick={() => addEquipment(item.type)}
                  className="w-full text-left px-2 py-1 rounded hover:bg-stone-800 text-xs group flex items-center gap-2"
                >
                  <MiniSymbol spec={item} />
                  <div className="flex-1 min-w-0">
                    <div className="group-hover:text-amber-400 truncate">{item.label}</div>
                    {item.detail && <div className="text-[9px] text-stone-500 truncate">{item.detail}</div>}
                  </div>
                  <Plus size={10} className="opacity-0 group-hover:opacity-100 text-amber-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="p-3 text-[10px] text-stone-500 leading-relaxed">
          Click an item to add. Drag on canvas to position.<br />
          <span className="text-stone-400 font-semibold">Shift+drag</span> to pan · <span className="text-stone-400 font-semibold">Scroll</span> to zoom
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden bg-stone-950">
        <div className="flex-1 overflow-hidden relative bg-stone-950" onWheel={onWheel}>
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ cursor: dragRef.current?.mode === "pan" ? "grabbing" : "default" }}
            onMouseDown={onCanvasMouseDown}
          >
            <defs>
              <pattern id="minorGrid" width={10} height={10} patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#292524" strokeWidth={0.15} />
              </pattern>
              <pattern id="majorGrid" width={50} height={50} patternUnits="userSpaceOnUse">
                <rect width={50} height={50} fill="url(#minorGrid)" />
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#44403c" strokeWidth={0.25} />
              </pattern>
            </defs>
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <rect x={-500} y={-500} width={3000} height={3000} fill="url(#majorGrid)" />
              <circle cx={0} cy={0} r={0.8} fill="#fbbf24" />
              <text x={2} y={-2} fontSize={2.2} fill="#a8a29e" fontFamily="ui-sans-serif" fontWeight="600">0,0</text>

              {sortedForRender.map((eq) => {
                const spec = LIB_BY_TYPE[eq.type];
                if (!spec) return null;
                return (
                  <g key={eq.id} onMouseDown={(e) => onEqMouseDown(e, eq)} style={{ cursor: "move" }}>
                    <EquipmentSymbol eq={eq} spec={spec} refNum={refNumbers[eq.id]} isSelected={eq.id === selectedId} />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* HUD */}
          <div className="absolute bottom-3 left-3 flex gap-1.5 bg-stone-900/90 backdrop-blur-sm border border-stone-800 rounded px-2 py-1 shadow-lg">
            <button onClick={() => setZoom((z) => Math.min(12, z * 1.2))} className="px-2 py-0.5 rounded hover:bg-stone-800"><Plus size={12} /></button>
            <div className="text-[10px] self-center w-12 text-center font-mono text-stone-400">{zoom.toFixed(1)}×</div>
            <button onClick={() => setZoom((z) => Math.max(0.5, z / 1.2))} className="px-2 py-0.5 rounded hover:bg-stone-800"><Minus size={12} /></button>
            <button onClick={() => { setZoom(1.6); setPan({ x: 20, y: 20 }); }} className="px-2 py-0.5 rounded hover:bg-stone-800 text-[10px] font-bold">FIT</button>
          </div>

          <div className="absolute bottom-3 left-44 bg-stone-900/90 backdrop-blur-sm border border-stone-800 rounded px-2 py-1 text-[10px] font-mono text-stone-400 flex items-center gap-2 shadow-lg">
            <div style={{ width: `${zoom * 50}px`, height: "6px", borderLeft: "1px solid #a8a29e", borderRight: "1px solid #a8a29e", borderBottom: "1px solid #a8a29e" }} />
            <span>50 ft</span>
          </div>

          <div className="absolute top-3 right-3 bg-stone-900/90 backdrop-blur-sm border border-stone-800 rounded px-3 py-1.5 text-[10px] font-mono text-stone-400 shadow-lg">
            {equipment.filter((e) => !NO_REF.has(e.type)).length} items · grid = 10 ft · scale {project.scale}
          </div>
        </div>

        {/* Reference table */}
        <div className="border-t border-stone-800 bg-stone-900 max-h-48 overflow-y-auto scroll-thin">
          <div className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-stone-500 font-bold border-b border-stone-800 sticky top-0 bg-stone-900 flex items-center gap-2">
            <Box size={10} className="text-amber-500" />
            Equipment Reference Table
            <span className="text-stone-600 font-normal normal-case tracking-normal ml-2">({refTableRows.length} items)</span>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-500">
                <th className="text-left px-4 py-1 font-semibold w-12">Ref #</th>
                <th className="text-left px-4 py-1 font-semibold">Description</th>
                <th className="text-left px-4 py-1 font-semibold">Details</th>
                <th className="text-left px-4 py-1 font-semibold">Identifier</th>
              </tr>
            </thead>
            <tbody>
              {refTableRows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-stone-800 hover:bg-stone-800 cursor-pointer transition-colors ${row.id === selectedId ? "bg-stone-800" : ""}`}
                  onClick={() => setSelectedId(row.id)}
                >
                  <td className="px-4 py-1 font-mono text-amber-400 font-bold">{row.num}</td>
                  <td className="px-4 py-1">{row.spec.label}</td>
                  <td className="px-4 py-1 text-stone-400 font-mono text-[11px]">{row.spec.detail || "—"}</td>
                  <td className="px-4 py-1 font-mono text-stone-300">{row.identifier || "—"}</td>
                </tr>
              ))}
              {refTableRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-stone-500 text-xs">
                    No equipment placed. Click items in the library to add them, or click <span className="text-amber-400 font-bold">"Load Demo"</span>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right: properties + project info */}
      <div className="w-72 border-l border-stone-800 bg-stone-900 overflow-y-auto scroll-thin">
        <PanelSection title="Selected Item">
          {selected ? (
            <SelectedPanel selected={selected} updateSelected={updateSelected} rotateSelected={rotateSelected} deleteSelected={deleteSelected} refNum={refNumbers[selected.id]} />
          ) : (
            <div className="p-4 text-xs text-stone-500 text-center italic">
              Nothing selected. Click an item on the canvas or in the reference table.
            </div>
          )}
        </PanelSection>
        <PanelSection title="Project Info" defaultOpen>
          <ProjectInfo project={project} setProject={setProject} />
        </PanelSection>
        <PanelSection title="Beneficial Use Equipment">
          <BeneficialUsePanel project={project} setProject={setProject} />
        </PanelSection>
      </div>
    </>
  );
}

// ============================================================
// EXPORT PREVIEW
// ============================================================
function PreviewView({ project, equipment, refNumbers, refTableRows, legendEntries, sortedForRender }) {
  const bounds = useMemo(() => {
    if (equipment.length === 0) return { minX: 0, minY: 0, maxX: 400, maxY: 300 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    equipment.forEach((eq) => {
      const { w, h } = getBox(eq);
      minX = Math.min(minX, eq.x);
      minY = Math.min(minY, eq.y);
      maxX = Math.max(maxX, eq.x + w);
      maxY = Math.max(maxY, eq.y + h);
    });
    const pad = 20;
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }, [equipment]);

  const viewW = bounds.maxX - bounds.minX;
  const viewH = bounds.maxY - bounds.minY;

  return (
    <div className="flex-1 overflow-auto bg-stone-800 scroll-thin p-6">
      <div
        className="preview-page mx-auto bg-white text-stone-900 shadow-2xl"
        style={{ width: "1400px", padding: "14px", fontFamily: "ui-sans-serif, system-ui" }}
      >
        <div className="flex flex-col border border-stone-900" style={{ minHeight: "870px" }}>
          {/* Drawing + legend + ref table */}
          <div className="flex border-b border-stone-900" style={{ minHeight: "620px" }}>
            <div className="flex-1 relative border-r border-stone-900 overflow-hidden bg-white">
              <svg
                className="w-full h-full"
                viewBox={`${bounds.minX} ${bounds.minY} ${viewW} ${viewH}`}
                preserveAspectRatio="xMidYMid meet"
                style={{ minHeight: "620px" }}
              >
                {sortedForRender.map((eq) => {
                  const spec = LIB_BY_TYPE[eq.type];
                  if (!spec) return null;
                  return (
                    <EquipmentSymbol key={eq.id} eq={eq} spec={spec} refNum={refNumbers[eq.id]} isSelected={false} monochrome={true} />
                  );
                })}

                {equipment
                  .filter((e) => e.type === "wellhead")
                  .map((wh, i) => {
                    const well = project.wells[i];
                    if (!well?.name) return null;
                    return (
                      <text key={wh.id} x={wh.x + 6} y={wh.y + 2} fontSize={3} fill="#111" fontFamily="ui-sans-serif" fontWeight="600">
                        {well.name}
                      </text>
                    );
                  })}
              </svg>
            </div>

            <div className="w-80 flex flex-col">
              <div className="border-b border-stone-900 p-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-1.5">Legend</div>
                <div className="grid grid-cols-1 gap-0.5 text-[10px]">
                  {legendEntries.slice(0, 14).map(({ spec }, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 flex-shrink-0 flex justify-center">
                        <svg width="22" height="14" viewBox="0 0 10 6">
                          <LegendGlyph shape={spec.shape} />
                        </svg>
                      </div>
                      <span>{spec.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 bg-stone-100">Reference Table</div>
                <div className="flex-1 overflow-y-auto scroll-thin" style={{ maxHeight: "500px" }}>
                  <table className="w-full text-[9px]">
                    <thead className="bg-stone-100 sticky top-0">
                      <tr className="border-b border-stone-400">
                        <th className="text-left px-1 py-0.5 font-semibold w-6">Ref</th>
                        <th className="text-left px-1 py-0.5 font-semibold">Description</th>
                        <th className="text-left px-1 py-0.5 font-semibold">Details</th>
                        <th className="text-left px-1 py-0.5 font-semibold w-14">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {refTableRows.map((row) => (
                        <tr key={row.id} className="border-b border-stone-200">
                          <td className="px-1 py-0.5 font-mono font-bold">{row.num}</td>
                          <td className="px-1 py-0.5">{row.spec.label}</td>
                          <td className="px-1 py-0.5 text-stone-600">{row.spec.detail}</td>
                          <td className="px-1 py-0.5 font-mono text-stone-700">{row.identifier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom title block */}
          <div className="flex" style={{ height: "180px" }}>
            <div className="w-36 border-r border-stone-900 p-2 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] font-bold mb-1">U.S. Feet</div>
              <div className="text-[10px] mb-3">Scale {project.scale}</div>
              <svg width="80" height="50" viewBox="0 0 80 50">
                <g transform="translate(40, 25)">
                  <polygon points="0,-18 6,8 0,4 -6,8" fill="#111" stroke="#111" strokeWidth="0.5" />
                  <text x="0" y="-20" textAnchor="middle" fontSize="6" fontWeight="700" fill="#111">N</text>
                  <line x1="-16" y1="14" x2="16" y2="14" stroke="#111" strokeWidth="0.6" />
                </g>
              </svg>
            </div>

            <div className="flex-1 border-r border-stone-900 p-2 overflow-hidden">
              <table className="w-full text-[9px] border border-stone-400">
                <thead>
                  <tr className="bg-amber-100 border-b border-stone-400">
                    <th className="text-left px-1 py-0.5 font-semibold">Beneficial Use Equipment</th>
                    <th className="text-left px-1 py-0.5 font-semibold w-20">Fuel Usage (Mscf/d)</th>
                    <th className="text-left px-1 py-0.5 font-semibold w-16">Calc Method</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.beneficialUse || []).map((bu, i) => (
                    <tr key={i} className="border-b border-stone-200">
                      <td className="px-1 py-0.5">{bu.equipment}</td>
                      <td className="px-1 py-0.5 font-mono">{bu.fuel}</td>
                      <td className="px-1 py-0.5">{bu.method}</td>
                    </tr>
                  ))}
                  {(project.beneficialUse || []).length === 0 && (
                    <tr><td colSpan="3" className="px-1 py-2 text-stone-500 italic text-center">No beneficial use equipment entered</td></tr>
                  )}
                </tbody>
              </table>
              {project.beneficialUseNote && (
                <div className="text-[8px] text-stone-600 italic mt-1">{project.beneficialUseNote}</div>
              )}
            </div>

            <div className="flex-1 flex border-r border-stone-900">
              {project.wells.slice(0, 2).map((w, i) => (
                <div key={i} className={`flex-1 p-2 ${i > 0 ? "border-l border-stone-400" : ""}`}>
                  <div className="text-[10px] font-bold mb-1">{w.name || "Well " + (i + 1)}</div>
                  <div className="text-[9px] space-y-0.5">
                    <div>API # {w.api || "—"}</div>
                    <div>Lease # {w.lease || "—"}</div>
                    <div>Federal CA # {w.federalCA || "—"}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-48 p-2">
              <div className="text-[10px] font-bold">{project.operator || "Operator"}</div>
              <div className="text-[9px] text-stone-700 mt-0.5">{project.operatorAddr}</div>
              <div className="text-[9px] text-stone-700">{project.operatorCity}</div>
              <div className="text-[9px] text-stone-500 mt-2 border-t pt-1 border-stone-300">
                Prepared by: <span className="font-semibold text-stone-800">{project.preparedBy || "—"}</span>
                {project.preparedByCompany && <span> · {project.preparedByCompany}</span>}
              </div>
              <div className="text-[9px] text-stone-500">Date: {project.date}</div>
            </div>
          </div>

          <div className="px-3 py-1 text-[9px] text-stone-700 border-t border-stone-400 bg-stone-50">
            <span className="font-semibold">Legal Description:</span> {project.strq || "—"}, {project.county || "—"} {project.state || ""} · Lat {project.lat || "—"} / Long {project.lng || "—"}
          </div>
        </div>
      </div>

      <div className="no-print text-center text-xs text-stone-500 mt-4">
        Export preview · Click <span className="text-amber-400 font-bold">Print / PDF</span> to export. Size: 17"×11" landscape.
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================
function MiniSymbol({ spec }) {
  const style = {
    background: spec.shape === "circle" || spec.shape === "rect" || spec.shape === "meter-fmp" ? `${spec.tint}26` : "transparent",
    border: spec.shape.includes("dashed") ? `1px dashed ${spec.tint}` : `1.5px solid ${spec.tint}`,
    borderRadius: spec.shape === "circle" || spec.shape === "meter-fmp" ? "50%" : "2px",
  };
  return (
    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center" style={style}>
      {spec.shape === "wellhead" && (
        <div className="relative w-4 h-4">
          <div className="absolute inset-0 border border-red-500 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500 -translate-x-1/2" />
        </div>
      )}
      {spec.shape === "meter-buyback-filled" && (
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px]" style={{ borderBottomColor: spec.tint }} />
      )}
    </div>
  );
}

function LegendGlyph({ shape }) {
  switch (shape) {
    case "circle":
      return <circle cx="5" cy="3" r="2" fill="none" stroke="#111" strokeWidth="0.3" />;
    case "rect":
      return <rect x="1.5" y="1.5" width="7" height="3" fill="none" stroke="#111" strokeWidth="0.3" />;
    case "rect-dashed":
    case "rect-dashed-thin":
      return <rect x="1.5" y="1.5" width="7" height="3" fill="none" stroke="#111" strokeWidth="0.3" strokeDasharray="0.5 0.4" />;
    case "wellhead":
      return (
        <g>
          <circle cx="5" cy="3" r="1.2" fill="none" stroke="#111" strokeWidth="0.25" />
          <line x1="2.5" y1="3" x2="7.5" y2="3" stroke="#111" strokeWidth="0.25" />
          <line x1="5" y1="0.5" x2="5" y2="5.5" stroke="#111" strokeWidth="0.25" />
        </g>
      );
    case "meter-gas":
      return (
        <g>
          <rect x="2.5" y="2" width="5" height="2" fill="none" stroke="#111" strokeWidth="0.25" />
          <line x1="3.5" y1="3" x2="6.5" y2="3" stroke="#111" strokeWidth="0.22" />
        </g>
      );
    case "meter-fmp":
      return (
        <g>
          <circle cx="5" cy="3" r="1.5" fill="none" stroke="#111" strokeWidth="0.25" />
          <line x1="3.8" y1="1.8" x2="6.2" y2="4.2" stroke="#111" strokeWidth="0.22" />
          <line x1="6.2" y1="1.8" x2="3.8" y2="4.2" stroke="#111" strokeWidth="0.22" />
        </g>
      );
    case "meter-buyback-filled":
      return <polygon points="5,1 7,5 3,5" fill="#111" />;
    case "meter-buyback-open":
      return <polygon points="5,1 7,5 3,5" fill="none" stroke="#111" strokeWidth="0.3" />;
    case "loadout":
      return (
        <g>
          <rect x="1.5" y="1.5" width="7" height="3" fill="none" stroke="#111" strokeWidth="0.25" />
          <line x1="5" y1="2" x2="5" y2="4" stroke="#111" strokeWidth="0.25" />
          <polyline points="4,3.3 5,4 6,3.3" fill="none" stroke="#111" strokeWidth="0.25" />
        </g>
      );
    default:
      return <rect x="1.5" y="1.5" width="7" height="3" fill="none" stroke="#111" strokeWidth="0.3" />;
  }
}

function PanelSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-stone-800">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-stone-500 font-bold text-left flex justify-between hover:bg-stone-850 transition-colors"
      >
        {title}
        <span className="text-stone-600">{open ? "−" : "+"}</span>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function SelectedPanel({ selected, updateSelected, rotateSelected, deleteSelected, refNum }) {
  const spec = LIB_BY_TYPE[selected.type];
  return (
    <div className="p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="text-stone-400">{spec?.label}</div>
        {refNum != null && (
          <div className="w-6 h-6 rounded-full bg-stone-950 border border-amber-500 flex items-center justify-center font-bold text-amber-500 text-xs">{refNum}</div>
        )}
      </div>
      {spec?.detail && <div className="text-[10px] text-stone-500 italic">{spec.detail}</div>}
      <Field label="Identifier / Serial #" value={selected.identifier} onChange={(v) => updateSelected({ identifier: v })} placeholder="e.g. 75480, ART 80314" />
      <Field label="Notes" value={selected.notes} onChange={(v) => updateSelected({ notes: v })} />
      <div className="grid grid-cols-2 gap-1.5">
        <Field label="X (ft)" value={selected.x} onChange={(v) => updateSelected({ x: parseFloat(v) || 0 })} />
        <Field label="Y (ft)" value={selected.y} onChange={(v) => updateSelected({ y: parseFloat(v) || 0 })} />
      </div>
      {(spec?.shape === "rect" || spec?.shape?.startsWith("rect-")) && (
        <div className="grid grid-cols-2 gap-1.5">
          <Field label="W (ft)" value={selected.w ?? spec.w} onChange={(v) => updateSelected({ w: parseFloat(v) || 1 })} />
          <Field label="H (ft)" value={selected.h ?? spec.h} onChange={(v) => updateSelected({ h: parseFloat(v) || 1 })} />
        </div>
      )}
      <Field label="Rotation (°)" value={selected.rot} onChange={(v) => updateSelected({ rot: parseFloat(v) || 0 })} />
      <div className="flex gap-1.5 pt-1">
        <button onClick={rotateSelected} className="flex-1 px-2 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-xs inline-flex items-center justify-center gap-1 transition-colors">
          <RotateCw size={11} /> +15°
        </button>
        <button onClick={deleteSelected} className="flex-1 px-2 py-1.5 rounded bg-red-900/60 hover:bg-red-800 text-xs inline-flex items-center justify-center gap-1 transition-colors">
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  );
}

function ProjectInfo({ project, setProject }) {
  return (
    <div className="px-3 pb-3 space-y-2 text-xs">
      <Field label="Operator" value={project.operator} onChange={(v) => setProject({ ...project, operator: v })} />
      <Field label="Operator Addr" value={project.operatorAddr} onChange={(v) => setProject({ ...project, operatorAddr: v })} />
      <Field label="City, State, Zip" value={project.operatorCity} onChange={(v) => setProject({ ...project, operatorCity: v })} />
      <Field label="Legal Description" value={project.strq} onChange={(v) => setProject({ ...project, strq: v })} placeholder="NWSW Section 35; T16S-R27E" />
      <div className="grid grid-cols-2 gap-1.5">
        <Field label="County" value={project.county} onChange={(v) => setProject({ ...project, county: v })} />
        <Field label="State" value={project.state} onChange={(v) => setProject({ ...project, state: v })} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Field label="Lat" value={project.lat} onChange={(v) => setProject({ ...project, lat: v })} />
        <Field label="Long" value={project.lng} onChange={(v) => setProject({ ...project, lng: v })} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Field label="Scale" value={project.scale} onChange={(v) => setProject({ ...project, scale: v })} />
        <Field label="Date" value={project.date} onChange={(v) => setProject({ ...project, date: v })} />
      </div>
      <Field label="Prepared By" value={project.preparedBy} onChange={(v) => setProject({ ...project, preparedBy: v })} />
      <Field label="Prepared By (Company)" value={project.preparedByCompany} onChange={(v) => setProject({ ...project, preparedByCompany: v })} placeholder="e.g. Cypress Natural Resources" />

      <div>
        <div className="text-[9px] uppercase tracking-wider text-stone-500 mb-1 mt-3 font-bold">Wells</div>
        {project.wells.map((w, i) => (
          <div key={i} className="space-y-1 mb-2 p-2 rounded bg-stone-850 border border-stone-800 relative">
            {project.wells.length > 1 && (
              <button
                onClick={() => setProject({ ...project, wells: project.wells.filter((_, j) => j !== i) })}
                className="absolute top-1 right-1 text-stone-600 hover:text-red-400 text-[10px]"
                title="Remove well"
              >×</button>
            )}
            <input
              value={w.name}
              onChange={(e) => { const w2 = [...project.wells]; w2[i] = { ...w2[i], name: e.target.value }; setProject({ ...project, wells: w2 }); }}
              placeholder="Well name"
              className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500"
            />
            <div className="grid grid-cols-2 gap-1">
              <input
                value={w.api}
                onChange={(e) => { const w2 = [...project.wells]; w2[i] = { ...w2[i], api: e.target.value }; setProject({ ...project, wells: w2 }); }}
                placeholder="API"
                className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500 font-mono"
              />
              <input
                value={w.lease}
                onChange={(e) => { const w2 = [...project.wells]; w2[i] = { ...w2[i], lease: e.target.value }; setProject({ ...project, wells: w2 }); }}
                placeholder="Lease"
                className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <input
              value={w.federalCA}
              onChange={(e) => { const w2 = [...project.wells]; w2[i] = { ...w2[i], federalCA: e.target.value }; setProject({ ...project, wells: w2 }); }}
              placeholder="Federal CA #"
              className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500 font-mono"
            />
          </div>
        ))}
        <button
          onClick={() => setProject({ ...project, wells: [...project.wells, { name: "", api: "", lease: "", federalCA: "" }] })}
          className="w-full text-xs px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition-colors"
        >+ Add well</button>
      </div>
    </div>
  );
}

function BeneficialUsePanel({ project, setProject }) {
  const items = project.beneficialUse || [];
  const update = (i, patch) => setProject({ ...project, beneficialUse: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const add = () => setProject({ ...project, beneficialUse: [...items, { equipment: "", fuel: "", method: "Manufacturer" }] });
  const remove = (i) => setProject({ ...project, beneficialUse: items.filter((_, j) => j !== i) });

  return (
    <div className="px-3 pb-3 space-y-2 text-xs">
      {items.map((bu, i) => (
        <div key={i} className="space-y-1 p-2 rounded bg-stone-850 border border-stone-800 relative">
          <button onClick={() => remove(i)} className="absolute top-1 right-1 text-stone-600 hover:text-red-400 text-[10px]">×</button>
          <input
            value={bu.equipment}
            onChange={(e) => update(i, { equipment: e.target.value })}
            placeholder="Equipment (e.g. Engine 1)"
            className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500"
          />
          <div className="grid grid-cols-2 gap-1">
            <input
              value={bu.fuel}
              onChange={(e) => update(i, { fuel: e.target.value })}
              placeholder="Mscf/d"
              className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500 font-mono"
            />
            <input
              value={bu.method}
              onChange={(e) => update(i, { method: e.target.value })}
              placeholder="Calc method"
              className="bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500"
            />
          </div>
        </div>
      ))}
      <button onClick={add} className="w-full text-xs px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 transition-colors">+ Add beneficial use item</button>
      <div>
        <div className="text-[9px] uppercase tracking-wider text-stone-500 mb-0.5">Footnote</div>
        <textarea
          value={project.beneficialUseNote || ""}
          onChange={(e) => setProject({ ...project, beneficialUseNote: e.target.value })}
          placeholder="e.g. *Heater treaters not currently in use"
          rows={2}
          className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-[10px] outline-none focus:border-amber-500 resize-none"
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-stone-500 mb-0.5 font-semibold">{label}</div>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-xs outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  );
}
