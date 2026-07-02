import { useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type EdgeProps,
  Handle,
  Position,
  type NodeProps,
  BackgroundVariant,
  NodeToolbar,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Megaphone, Globe, ShoppingCart, TrendingUp, TrendingDown,
  Mail, MessageCircle, Users, Smartphone, Plus, Trash2, Gift, Copy, RefreshCw, ArrowLeftRight,
} from "lucide-react";

// ─── Catálogo ────────────────────────────────────────────────────────────────
export const NODE_CATALOG = [
  { type: "adMeta",    label: "AD Meta",          icon: Megaphone,     color: "#1877F2" },
  { type: "salesPage", label: "Pág. de Vendas",   icon: Globe,         color: "#1FA2FF" },
  { type: "checkout",  label: "Checkout",          icon: ShoppingCart,  color: "#27D38B" },
  { type: "orderBump", label: "Order Bump",        icon: Gift,          color: "#F59E0B" },
  { type: "upsell",    label: "Upsell",            icon: TrendingUp,    color: "#A78BFA" },
  { type: "downsell",  label: "Downsell",          icon: TrendingDown,  color: "#FF8C42" },
  { type: "upsell2",   label: "Upsell 2",          icon: TrendingUp,    color: "#9B59B6" },
  { type: "email",     label: "E-mail",            icon: Mail,          color: "#E74C3C" },
  { type: "whatsapp",  label: "WhatsApp",          icon: MessageCircle, color: "#25D366" },
  { type: "audience",  label: "Audiência",         icon: Users,         color: "#9AA3B2" },
  { type: "sms",       label: "SMS",               icon: Smartphone,    color: "#FF5C5C" },
];

// ─── Nó customizado ───────────────────────────────────────────────────────────
interface FunnelNodeData {
  nodeType: string;
  label: string;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onChangeType: (id: string, type: string) => void;
}

function FunnelNode({ id, data, selected }: NodeProps) {
  const d = data as unknown as FunnelNodeData;
  const cat = NODE_CATALOG.find((n) => n.type === d.nodeType) ?? NODE_CATALOG[0];
  const Icon = cat.icon;
  const [showTypeList, setShowTypeList] = useState(false);

  return (
    <>
      {/* Toolbar flutuante ao selecionar */}
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "hsl(226 17% 12%)",
            border: "1px solid hsl(224 15% 22%)",
            borderRadius: 10,
            padding: "5px 8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          }}
        >
          {/* Duplicar */}
          <ToolBtn
            title="Duplicar"
            onClick={() => d.onDuplicate(id)}
            icon={<Copy style={{ width: 12, height: 12 }} />}
            color="#1FA2FF"
          />

          {/* Mudar etapa */}
          <div style={{ position: "relative" }}>
            <ToolBtn
              title="Mudar etapa"
              onClick={() => setShowTypeList((v) => !v)}
              icon={<RefreshCw style={{ width: 12, height: 12 }} />}
              color="#F5C451"
              active={showTypeList}
            />
            {showTypeList && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "hsl(226 17% 12%)",
                  border: "1px solid hsl(224 15% 22%)",
                  borderRadius: 10,
                  padding: 6,
                  minWidth: 160,
                  zIndex: 1000,
                  boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
                }}
              >
                <div style={{ fontSize: 9, color: "#9AA3B2", textTransform: "uppercase", letterSpacing: 1, padding: "2px 6px 6px" }}>
                  Mudar para
                </div>
                {NODE_CATALOG.map((item) => {
                  const ItemIcon = item.icon;
                  const isCurrent = item.type === d.nodeType;
                  return (
                    <button
                      key={item.type}
                      onClick={() => { d.onChangeType(id, item.type); setShowTypeList(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        width: "100%", padding: "5px 6px", borderRadius: 6,
                        background: isCurrent ? `${item.color}22` : "transparent",
                        border: "none", cursor: "pointer",
                        opacity: isCurrent ? 1 : 0.8,
                      }}
                      onMouseEnter={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "hsl(225 16% 18%)"; }}
                      onMouseLeave={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <ItemIcon style={{ width: 11, height: 11, color: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "#F2F4F8", whiteSpace: "nowrap" }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ width: 1, height: 18, background: "hsl(224 15% 22%)", margin: "0 2px" }} />

          {/* Deletar */}
          <ToolBtn
            title="Deletar"
            onClick={() => d.onDelete(id)}
            icon={<Trash2 style={{ width: 12, height: 12 }} />}
            color="#FF5C5C"
          />
        </div>
      </NodeToolbar>

      {/* Card */}
      <div
        style={{
          width: 148,
          background: "hsl(225 16% 11%)",
          border: `2px solid ${selected ? cat.color : "hsl(224 15% 20%)"}`,
          borderRadius: 10,
          boxShadow: selected
            ? `0 0 0 1px ${cat.color}44, 0 0 18px ${cat.color}55, 0 0 40px ${cat.color}22`
            : `0 0 8px ${cat.color}22`,
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = `0 0 0 1px ${cat.color}44, 0 0 18px ${cat.color}55, 0 0 40px ${cat.color}22`;
          el.style.borderColor = cat.color;
        }}
        onMouseLeave={(e) => {
          if (selected) return;
          const el = e.currentTarget as HTMLElement;
          el.style.boxShadow = `0 0 8px ${cat.color}22`;
          el.style.borderColor = "hsl(224 15% 20%)";
        }}
      >
        {/* Handles nos 4 lados */}
        {([Position.Top, Position.Bottom, Position.Left, Position.Right] as Position[]).map((pos) => (
          <span key={pos}>
            <Handle
              type="target"
              position={pos}
              id={`t-${pos}`}
              style={{ background: cat.color, width: 9, height: 9, border: "2px solid hsl(225 22% 5%)" }}
            />
            <Handle
              type="source"
              position={pos}
              id={`s-${pos}`}
              style={{ background: cat.color, width: 9, height: 9, border: "2px solid hsl(225 22% 5%)", opacity: 0.65 }}
            />
          </span>
        ))}

        <div style={{ padding: "9px 11px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, flexShrink: 0,
            background: `${cat.color}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon style={{ width: 13, height: 13, color: cat.color }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#F2F4F8", lineHeight: 1.3, wordBreak: "break-word" }}>
              {(d.label as string) ?? cat.label}
            </div>
            <div style={{ fontSize: 9, color: cat.color, marginTop: 1, opacity: 0.75 }}>
              {cat.label}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ToolBtn({ title, onClick, icon, color, active }: {
  title: string; onClick: () => void; icon: React.ReactNode; color: string; active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: 6, border: "none",
        background: active ? `${color}33` : "transparent",
        color, cursor: "pointer", transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${color}33`; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {icon}
    </button>
  );
}

// ─── Aresta customizada com toolbar ──────────────────────────────────────────
function SmartEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, selected,
  source, target,
}: EdgeProps) {
  const { setEdges, getEdge } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const deleteEdge = () => setEdges((eds) => eds.filter((e) => e.id !== id));

  const reverseEdge = () => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== id) return e;
        return { ...e, source: e.target, target: e.source };
      }),
    );
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: "#1FA2FF",
          strokeWidth: selected ? 3 : 2,
          filter: selected ? "drop-shadow(0 0 4px #1FA2FF88)" : undefined,
        }}
      />
      <EdgeLabelRenderer>
        {selected && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", gap: 3,
                background: "hsl(226 17% 12%)",
                border: "1px solid hsl(224 15% 22%)",
                borderRadius: 8, padding: "4px 6px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              <ToolBtn
                title="Inverter sentido"
                onClick={reverseEdge}
                icon={<ArrowLeftRight style={{ width: 11, height: 11 }} />}
                color="#1FA2FF"
              />
              <div style={{ width: 1, height: 14, background: "hsl(224 15% 22%)" }} />
              <ToolBtn
                title="Deletar linha"
                onClick={deleteEdge}
                icon={<Trash2 style={{ width: 11, height: 11 }} />}
                color="#FF5C5C"
              />
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes: NodeTypes = { funnelNode: FunnelNode };
const edgeTypes: EdgeTypes = { smartEdge: SmartEdge };

// ─── Estado inicial ───────────────────────────────────────────────────────────
const mkNode = (id: string, type: string, x: number, y: number) => ({
  id, type: "funnelNode", position: { x, y },
  data: { nodeType: type, label: NODE_CATALOG.find((c) => c.type === type)?.label ?? type },
});

const EDGE_STYLE = { type: "smartEdge", style: { stroke: "#1FA2FF", strokeWidth: 2 }, animated: false };

const initialNodes = [
  mkNode("1", "adMeta",    300, 40),
  mkNode("2", "salesPage", 300, 180),
  mkNode("3", "checkout",  300, 320),
  mkNode("4", "orderBump", 300, 460),
  mkNode("5", "upsell",    120, 600),
  mkNode("6", "downsell",  480, 600),
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", ...EDGE_STYLE },
  { id: "e2-3", source: "2", target: "3", ...EDGE_STYLE },
  { id: "e3-4", source: "3", target: "4", ...EDGE_STYLE },
  { id: "e4-5", source: "4", target: "5", ...EDGE_STYLE, style: { stroke: "#A78BFA", strokeWidth: 2 } },
  { id: "e4-6", source: "4", target: "6", ...EDGE_STYLE, style: { stroke: "#FF8C42", strokeWidth: 2 } },
];

// ─── Página ───────────────────────────────────────────────────────────────────
export default function FunnelBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [counter, setCounter] = useState(initialNodes.length + 1);

  // Callbacks passados para os nós via data
  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  const duplicateNode = useCallback((id: string) => {
    setNodes((nds) => {
      const original = nds.find((n) => n.id === id);
      if (!original) return nds;
      const newId = String(Date.now());
      return [...nds, {
        ...original,
        id: newId,
        position: { x: original.position.x + 30, y: original.position.y + 30 },
        selected: false,
        data: { ...(original.data as object), onDelete: deleteNode, onDuplicate: duplicateNode, onChangeType: changeType },
      }];
    });
  }, [setNodes]);

  const changeType = useCallback((id: string, newType: string) => {
    const cat = NODE_CATALOG.find((c) => c.type === newType);
    if (!cat) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id
          ? { ...n, data: { ...(n.data as object), nodeType: newType, label: cat.label } }
          : n,
      ),
    );
  }, [setNodes]);

  const addNode = useCallback((cat: typeof NODE_CATALOG[0]) => {
    const id = String(counter);
    setNodes((nds) => [
      ...nds,
      {
        id, type: "funnelNode",
        position: { x: 160 + Math.random() * 260, y: 60 + Math.random() * 360 },
        data: { nodeType: cat.type, label: cat.label, onDelete: deleteNode, onDuplicate: duplicateNode, onChangeType: changeType },
      },
    ]);
    setCounter((c) => c + 1);
  }, [counter, setNodes, deleteNode, duplicateNode, changeType]);

  // Injetar callbacks nos nós existentes
  const nodesWithCallbacks = nodes.map((n) => ({
    ...n,
    data: { ...(n.data as object), onDelete: deleteNode, onDuplicate: duplicateNode, onChangeType: changeType },
  }));

  const onConnect = useCallback(
    (conn: Connection) =>
      setEdges((eds) => addEdge({ ...conn, type: "smartEdge", animated: false, style: { stroke: "#1FA2FF", strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Painel lateral */}
      <div className="w-36 sm:w-44 shrink-0 border-r border-border bg-surface overflow-y-auto p-2 flex flex-col gap-1 z-10">
        <div className="text-[10px] label-caps px-1 pt-1 pb-2 text-muted-foreground">Blocos</div>
        {NODE_CATALOG.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => addNode(item)}
              title={item.label}
              className="flex items-center gap-2 p-2 rounded-lg border border-border bg-surface-elevated hover:border-primary/40 hover:bg-primary/5 transition-all text-left group w-full"
            >
              <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: `${item.color}22` }}>
                <Icon className="h-3 w-3" style={{ color: item.color }} />
              </div>
              <span className="text-[11px] font-medium text-foreground truncate">{item.label}</span>
              <Plus className="h-3 w-3 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>

      {/* Canvas 100% */}
      <div className="flex-1" style={{ background: "hsl(225 22% 5%)" }}>
        <style>{`
          .react-flow__controls {
            background: hsl(226 17% 10%) !important;
            border: 1px solid hsl(224 15% 19%) !important;
            border-radius: 10px !important;
            box-shadow: none !important;
            overflow: hidden;
          }
          .react-flow__controls-button {
            background: hsl(226 17% 10%) !important;
            border-bottom: 1px solid hsl(224 15% 19%) !important;
            fill: hsl(219 13% 65%) !important;
          }
          .react-flow__controls-button:hover {
            background: hsl(225 16% 18%) !important;
            fill: hsl(220 20% 96%) !important;
          }
          .react-flow__controls-button svg { fill: inherit !important; }
          .react-flow__minimap {
            border-radius: 10px !important;
            overflow: hidden;
            border: 1px solid hsl(224 15% 19%) !important;
          }
          .react-flow__edge-path { stroke: #1FA2FF !important; stroke-width: 2 !important; }
          .react-flow__node-toolbar { z-index: 100 !important; }
        `}</style>
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
          style={{ background: "hsl(225 22% 5%)" }}
          deleteKeyCode={["Delete", "Backspace"]}
          defaultEdgeOptions={{ type: "smartEdge", animated: false, style: { stroke: "#1FA2FF", strokeWidth: 2 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="hsl(224 15% 20%)" />
          <Controls showInteractive={false} />
          <MiniMap
            style={{ background: "hsl(226 17% 10%)" }}
            nodeColor={(n) => NODE_CATALOG.find((c) => c.type === (n.data as { nodeType: string })?.nodeType)?.color ?? "#1FA2FF"}
            maskColor="hsl(225 22% 5% / 0.75)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
