import { useState, useEffect, useRef } from "react";
import { fetchAgenticNetwork } from "../../services/api";

export default function AgenticNetwork() {
  const [networkData, setNetworkData] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [layoutMode, setLayoutMode] = useState("spherical"); // spherical | hierarchical | ring

  const canvasRef = useRef(null);
  const rotationRef = useRef({ x: 0.2, y: 0.4 });
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const hoveredNodeRef = useRef(null);
  const animFrameRef = useRef(null);
  const packetsRef = useRef([]);

  useEffect(() => {
    let mounted = true;
    fetchAgenticNetwork().then((data) => {
      if (mounted) {
        setNetworkData(data);
        if (data.nodes && data.nodes.length > 0) {
          setSelectedAgent(data.nodes[0]); // default to coordinator
        }
        setLoading(false);
      }
    });

    // Generate traveling packets along edges
    const initialPackets = [];
    for (let i = 0; i < 35; i++) {
      initialPackets.push({
        edgeIndex: i % 25,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.008,
      });
    }
    packetsRef.current = initialPackets;

    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // 3D Canvas Rendering Loop
  useEffect(() => {
    if (!networkData || !networkData.nodes) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let lastTime = performance.now();

    const render = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Handle resize
      const width = canvas.parentElement.clientWidth || 900;
      const height = canvas.parentElement.clientHeight || 650;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (autoRotate && !isDraggingRef.current) {
        rotationRef.current.y += 0.25 * dt;
      }

      // Clear dark blue starry background
      ctx.fillStyle = "#040c1e";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle background grid & radial glow
      const cx = width / 2 + panRef.current.x;
      const cy = height / 2 + panRef.current.y;

      const bgGradient = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.75);
      bgGradient.addColorStop(0, "rgba(14, 45, 95, 0.45)");
      bgGradient.addColorStop(0.5, "rgba(6, 21, 51, 0.65)");
      bgGradient.addColorStop(1, "rgba(3, 10, 26, 0.98)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Coordinate transformation matrix (Euler angles + perspective)
      const rotX = rotationRef.current.x;
      const rotY = rotationRef.current.y;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const fov = 700; // perspective distance
      const zoom = zoomLevel;

      // Project nodes to 2D
      const projectedNodes = networkData.nodes.map((node) => {
        let { x, y, z } = node;

        // Apply layout adjustments if chosen
        if (layoutMode === "ring") {
          const angle = (node.tier === 1 ? 0 : node.radius || 200) + (node.id.charCodeAt(0) * 0.2);
          x = Math.cos(angle) * (node.tier === 1 ? 0 : 260);
          z = Math.sin(angle) * (node.tier === 1 ? 0 : 260);
          y = (node.tier - 2) * 60;
        } else if (layoutMode === "hierarchical") {
          y = (node.tier - 2) * 130;
          x = (node.x || 0) * 0.75;
          z = (node.z || 0) * 0.75;
        }

        // Apply Y rotation
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;

        // Apply X rotation
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective division
        const distance = fov + z2 * zoom;
        const scale = distance > 0 ? (fov / distance) * zoom : 0.1;
        const screenX = cx + x1 * scale;
        const screenY = cy + y2 * scale;

        return {
          ...node,
          screenX,
          screenY,
          scale,
          depth: z2,
        };
      });

      // Sort by depth for correct painter's algorithm
      projectedNodes.sort((a, b) => b.depth - a.depth);
      const nodeLookup = {};
      projectedNodes.forEach((n) => (nodeLookup[n.id] = n));

      // Draw edges
      networkData.edges.forEach((edge, idx) => {
        const src = nodeLookup[edge.source];
        const tgt = nodeLookup[edge.target];
        if (!src || !tgt) return;

        ctx.beginPath();
        ctx.moveTo(src.screenX, src.screenY);
        ctx.lineTo(tgt.screenX, tgt.screenY);

        const isHighlight =
          selectedAgent && (selectedAgent.id === src.id || selectedAgent.id === tgt.id);

        if (isHighlight) {
          ctx.strokeStyle = "rgba(0, 240, 255, 0.75)";
          ctx.lineWidth = Math.max(1.8, 2.5 * ((src.scale + tgt.scale) / 2));
        } else if (edge.active) {
          ctx.strokeStyle = "rgba(40, 110, 195, 0.4)";
          ctx.lineWidth = Math.max(0.8, 1.2 * ((src.scale + tgt.scale) / 2));
        } else {
          ctx.strokeStyle = "rgba(25, 60, 110, 0.2)";
          ctx.lineWidth = 0.6;
        }
        ctx.stroke();
      });

      // Update and draw traveling data packets
      packetsRef.current.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1.0) pkt.progress = 0;

        const edge = networkData.edges[pkt.edgeIndex % networkData.edges.length];
        if (!edge) return;
        const src = nodeLookup[edge.source];
        const tgt = nodeLookup[edge.target];
        if (!src || !tgt) return;

        const px = src.screenX + (tgt.screenX - src.screenX) * pkt.progress;
        const py = src.screenY + (tgt.screenY - src.screenY) * pkt.progress;
        const pScale = (src.scale + tgt.scale) / 2;

        ctx.beginPath();
        ctx.arc(px, py, Math.max(2, 3.5 * pScale), 0, Math.PI * 2);
        ctx.fillStyle = edge.active ? "#00f0ff" : "#38bdf8";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw nodes
      projectedNodes.forEach((node) => {
        const isSelected = selectedAgent && selectedAgent.id === node.id;
        const isHovered = hoveredNodeRef.current && hoveredNodeRef.current.id === node.id;
        const baseRadius = node.tier === 1 ? 14 : node.tier === 2 ? 10 : 7;
        const r = Math.max(4, baseRadius * node.scale);

        // Outer glow on active/selected nodes
        if (isSelected || isHovered) {
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, r + 7, 0, Math.PI * 2);
          ctx.fillStyle = isSelected
            ? "rgba(0, 240, 255, 0.35)"
            : "rgba(56, 189, 248, 0.25)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, r, 0, Math.PI * 2);

        // Color coding by status & category
        if (node.status === "ACTIVE") {
          if (node.tier === 1) {
            ctx.fillStyle = "#00f0ff"; // Coordinator cyan
          } else if (node.category === "Adversarial") {
            ctx.fillStyle = "#f59e0b"; // Challenger amber
          } else if (node.category === "Reasoning") {
            ctx.fillStyle = "#a855f7"; // Hypothesis purple
          } else {
            ctx.fillStyle = "#38bdf8"; // Electric blue
          }
        } else {
          ctx.fillStyle = "#475569"; // Idle slate
        }

        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = isSelected ? 16 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.stroke();

        // Node label
        if (node.scale > 0.45 || isSelected || isHovered) {
          ctx.font = `${Math.max(10, Math.min(13, 11 * node.scale))}px Inter, sans-serif`;
          ctx.fillStyle = isSelected ? "#00f0ff" : "#e2e8f0";
          ctx.textAlign = "center";
          ctx.fillText(node.name.replace(" Agent", ""), node.screenX, node.screenY + r + 13);

          if (isSelected) {
            ctx.font = "9px Inter, sans-serif";
            ctx.fillStyle = "#94a3b8";
            ctx.fillText(node.status, node.screenX, node.screenY + r + 24);
          }
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [networkData, selectedAgent, autoRotate, zoomLevel, layoutMode]);

  // Mouse interaction handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !networkData) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      if (e.buttons === 2 || e.shiftKey) {
        // Pan
        panRef.current.x += dx;
        panRef.current.y += dy;
      } else {
        // Orbit rotate
        rotationRef.current.y += dx * 0.007;
        rotationRef.current.x -= dy * 0.007;
      }
    } else {
      // Check node hover
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      if (networkData && networkData.nodes) {
        // Approximate hit test
        const cx = canvas.width / 2 + panRef.current.x;
        const cy = canvas.height / 2 + panRef.current.y;
        const cosX = Math.cos(rotationRef.current.x);
        const sinX = Math.sin(rotationRef.current.x);
        const cosY = Math.cos(rotationRef.current.y);
        const sinY = Math.sin(rotationRef.current.y);
        const fov = 700;

        for (const node of networkData.nodes) {
          const x1 = node.x * cosY - node.z * sinY;
          const z1 = node.x * sinY + node.z * cosY;
          const y2 = node.y * cosX - z1 * sinX;
          const z2 = node.y * sinX + z1 * cosX;
          const distance = fov + z2 * zoomLevel;
          const scale = distance > 0 ? (fov / distance) * zoomLevel : 0.1;
          const screenX = cx + x1 * scale;
          const screenY = cy + y2 * scale;
          const dist = Math.hypot(mouseX - screenX, mouseY - screenY);

          if (dist < 18) {
            found = node;
            break;
          }
        }
      }
      hoveredNodeRef.current = found;
      canvas.style.cursor = found ? "pointer" : isDraggingRef.current ? "grabbing" : "grab";
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    if (hoveredNodeRef.current) {
      setSelectedAgent(hoveredNodeRef.current);
    }
  };

  // Wheel Zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0015;
    setZoomLevel((prev) => Math.min(3.5, Math.max(0.35, prev + zoomDelta)));
  };

  const resetView = () => {
    rotationRef.current = { x: 0.2, y: 0.4 };
    panRef.current = { x: 0, y: 0 };
    setZoomLevel(1.0);
  };

  return (
    <section className="network-page">
      <div className="dashboard-heading heading-with-action">
        <div>
          <span className="hero-label">3D AGENTIC TOPOLOGY</span>
          <h1>Agentic Network</h1>
          <p>
            Interactive 3D visualization of all autonomous agents, operational states, and live telemetry data flows.
          </p>
        </div>

        <div className="network-controls-bar">
          <div className="network-badge-group">
            <span className="metric-pill cyan">
              <strong>{networkData?.total_agents || 24}</strong> Total Agents
            </span>
            <span className="metric-pill green">
              <span className="pulsing-dot"></span>
              <strong>{networkData?.active_agents || 19}</strong> Active Currently
            </span>
            <span className="metric-pill gray">
              <strong>{networkData?.idle_agents || 5}</strong> Idle
            </span>
            <span className="metric-pill blue">
              Zoom: <strong>{Math.round(zoomLevel * 100)}%</strong>
            </span>
          </div>

          <div className="btn-group">
            <button
              className={`ctrl-btn ${autoRotate ? "active" : ""}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title="Toggle Auto-Orbit"
            >
              {autoRotate ? "⏸ Pause Orbit" : "▶ Auto-Orbit"}
            </button>
            <button className="ctrl-btn" onClick={() => setZoomLevel((z) => Math.min(3.5, z + 0.25))}>
              + Zoom In
            </button>
            <button className="ctrl-btn" onClick={() => setZoomLevel((z) => Math.max(0.35, z - 0.25))}>
              - Zoom Out
            </button>
            <button className="ctrl-btn" onClick={resetView}>
              ⟲ Reset View
            </button>
          </div>
        </div>
      </div>

      <div className="network-workspace-container">
        {/* 3D Canvas Viewport */}
        <div className="canvas-viewport-wrapper">
          <canvas
            ref={canvasRef}
            className="agentic-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
          />

          <div className="canvas-overlay-hints">
            <span>🖱 Drag to rotate in 3D</span>
            <span>⚲ Scroll wheel to zoom in/out</span>
            <span>⇪ Shift + Drag to pan</span>
            <span>Click any node to inspect agent</span>
          </div>

          {/* Layout switcher */}
          <div className="layout-switcher">
            <button
              className={layoutMode === "spherical" ? "active" : ""}
              onClick={() => setLayoutMode("spherical")}
            >
              Orbital Sphere
            </button>
            <button
              className={layoutMode === "hierarchical" ? "active" : ""}
              onClick={() => setLayoutMode("hierarchical")}
            >
              Hierarchy
            </button>
            <button
              className={layoutMode === "ring" ? "active" : ""}
              onClick={() => setLayoutMode("ring")}
            >
              Ring Mesh
            </button>
          </div>
        </div>

        {/* Selected Agent Telemetry Inspector */}
        <aside className="agent-inspector-panel">
          {selectedAgent ? (
            <div className="inspector-content">
              <div className="inspector-header">
                <div className="agent-avatar-tag">
                  {selectedAgent.name.charAt(0)}
                </div>
                <div>
                  <h2>{selectedAgent.name}</h2>
                  <span className="category-pill">{selectedAgent.category} • Tier {selectedAgent.tier}</span>
                </div>
              </div>

              <div className="status-indicator-box">
                <div className="status-indicator-row">
                  <span className="label">Current Status:</span>
                  <span className={`status-badge-live ${selectedAgent.status.toLowerCase()}`}>
                    <span className="pulse-dot"></span>
                    {selectedAgent.status}
                  </span>
                </div>

                <div className="current-mission">
                  <span className="label">Current Work Performing:</span>
                  <p className="work-description">{selectedAgent.current_work}</p>
                </div>
              </div>

              <div className="agent-telemetry-metrics">
                <div className="telemetry-card">
                  <span className="t-label">Cognitive Load</span>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${selectedAgent.cognitive_load_pct}%` }}
                    ></div>
                  </div>
                  <span className="t-val">{selectedAgent.cognitive_load_pct}%</span>
                </div>

                <div className="telemetry-card">
                  <span className="t-label">Throughput</span>
                  <span className="t-val">{selectedAgent.tokens_per_sec} tok/sec</span>
                </div>

                <div className="telemetry-card">
                  <span className="t-label">Active Memory</span>
                  <span className="t-val">{selectedAgent.memory_mb} MB</span>
                </div>
              </div>

              <div className="inspector-section">
                <h3>Role Description</h3>
                <p className="description-text">{selectedAgent.description}</p>
              </div>

              <div className="inspector-section">
                <h3>Direct Agent Mesh Links ({selectedAgent.connections?.length || 0})</h3>
                <div className="connected-chips">
                  {selectedAgent.connections?.map((targetId) => (
                    <span
                      key={targetId}
                      className="link-chip"
                      onClick={() => {
                        const target = networkData.nodes.find((n) => n.id === targetId);
                        if (target) setSelectedAgent(target);
                      }}
                    >
                      → {targetId.replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="inspector-section">
                <h3>Telemetry Log Stream</h3>
                <div className="mini-log-terminal">
                  <code>[00:04] Initialized memory buffer</code>
                  <code>[00:03] Processing incoming stream packet</code>
                  <code>[00:02] Connected to coordinator mesh</code>
                  <code>[00:01] Telemetry heartbeat ACK</code>
                </div>
              </div>
            </div>
          ) : (
            <div className="inspector-empty">
              <p>Select any agent in the 3D network to view its real-time telemetry.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
