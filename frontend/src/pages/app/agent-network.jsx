
import { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import * as THREE from "three";
import "../../agent-network.css";

const agents = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: i === 0 ? "Coordinator" : `Agent ${String(i + 1).padStart(2, "0")}`,
  role:
    i === 0
      ? "Central orchestration and task coordination"
      : "Specialist investigation agent",
  status: i === 0 ? "active" : i % 5 === 0 ? "idle" : "active",
}));

function createSpherePoints(count, radius = 3) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const ringRadius = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;

    points.push(
      new THREE.Vector3(
        Math.cos(theta) * ringRadius * radius,
        y * radius,
        Math.sin(theta) * ringRadius * radius
      )
    );
  }

  return points;
}

function createConnections(points) {
  const pairs = new Set();

  points.forEach((point, index) => {
    const nearest = points
      .map((other, otherIndex) => ({
        index: otherIndex,
        distance: point.distanceTo(other),
      }))
      .filter((item) => item.index !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);

    nearest.forEach(({ index: otherIndex }) => {
      const key = [index, otherIndex].sort((a, b) => a - b).join("-");
      pairs.add(key);
    });
  });

  return [...pairs].map((pair) => pair.split("-").map(Number));
}

function AgentNode({ agent, position, selected, onSelect }) {
  return (
    <group position={position}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(agent);
        }}
      >
        <sphereGeometry args={[selected ? 0.105 : 0.075, 24, 24]} />
        <meshStandardMaterial
          color={selected ? "#ffffff" : "#9eeaff"}
          emissive={selected ? "#ffffff" : "#35bfff"}
          emissiveIntensity={selected ? 3 : 2}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[selected ? 0.17 : 0.12, 20, 20]} />
        <meshBasicMaterial
          color="#49caff"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      <pointLight color="#50caff" intensity={0.35} distance={1.2} />
    </group>
  );
}

function NetworkSphere({ selectedAgent, onSelect }) {
  const groupRef = useRef();
  const points = useMemo(() => createSpherePoints(30), []);
  const connections = useMemo(() => createConnections(points), []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.055;
    }
  });

  return (
    <group ref={groupRef}>
      {connections.map(([a, b], index) => (
        <Line
          key={index}
          points={[points[a].toArray(), points[b].toArray()]}
          color="#7bdcff"
          transparent
          opacity={0.38}
          lineWidth={0.7}
        />
      ))}

      {points.map((point, index) => (
        <AgentNode
          key={agents[index].id}
          agent={agents[index]}
          position={point}
          selected={selectedAgent?.id === agents[index].id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

export default function AgentNetwork() {
  const [selectedAgent, setSelectedAgent] = useState(agents[0]);

  const activeCount = agents.filter(
    (agent) => agent.status === "active"
  ).length;

  return (
    <div className="agent-network-page">
      <div className="agent-network-heading">
        <div>
          <p className="agent-eyebrow">AUTONOMOUS INTELLIGENCE</p>
          <h1>Agent Network</h1>
          <p className="agent-subtitle">
            Explore the interconnected intelligence of your 30 AI agents.
          </p>
        </div>

        <div className="agent-live-indicator">
          <span /> VISUAL PREVIEW
        </div>
      </div>

      <div className="agent-network-stats">
        <div><span>Total Agents</span><strong>30</strong></div>
        <div><span>Active</span><strong>{activeCount}</strong></div>
        <div><span>Connections</span><strong>{connectionsCount()}</strong></div>
        <div><span>Network</span><strong>3D</strong></div>
      </div>

      <div className="agent-network-stage">
        <div className="agent-network-canvas">
          <Canvas camera={{ position: [0, 0, 9], fov: 48 }}>
            <color attach="background" args={["#050b16"]} />
            <ambientLight intensity={0.65} />
            <pointLight position={[5, 5, 5]} intensity={1.4} color="#6bdcff" />
            <pointLight position={[-5, -3, -5]} intensity={1} color="#315bff" />

            <Stars
              radius={80}
              depth={45}
              count={1600}
              factor={2}
              saturation={0}
              fade
            />

            <NetworkSphere
              selectedAgent={selectedAgent}
              onSelect={setSelectedAgent}
            />

            <OrbitControls
              enablePan={false}
              minDistance={5}
              maxDistance={14}
              autoRotate
              autoRotateSpeed={0.35}
            />
          </Canvas>

          <div className="agent-canvas-hint">
            DRAG TO ROTATE · SCROLL TO ZOOM · CLICK A NODE
          </div>
        </div>

        <aside className="agent-details-panel">
          <p className="agent-eyebrow">SELECTED NODE</p>

          <div className="agent-selected-orb"><span /></div>
          <h2>{selectedAgent.name}</h2>
          <p className="agent-detail-role">{selectedAgent.role}</p>

          <div className="agent-detail-divider" />

          <div className="agent-detail-row">
            <span>Agent ID</span>
            <strong>AG-{String(selectedAgent.id).padStart(3, "0")}</strong>
          </div>

          <div className="agent-detail-row">
            <span>Status</span>
            <strong className="agent-status">
              <i /> {selectedAgent.status.toUpperCase()}
            </strong>
          </div>

          <div className="agent-detail-row">
            <span>Network position</span>
            <strong>Sphere node</strong>
          </div>

          <button
            className="agent-reset-button"
            onClick={() => setSelectedAgent(agents[0])}
          >
            Select Coordinator
          </button>
        </aside>
      </div>

      <p className="agent-preview-note">
        Preview mode: agent statuses and connections are illustrative.
        Live backend activity will be integrated later.
      </p>
    </div>
  );
}

function connectionsCount() {
  return createConnections(createSpherePoints(30)).length;
}
