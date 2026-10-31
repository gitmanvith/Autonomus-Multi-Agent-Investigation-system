"""
Network Service — Autonomous Multi-Agent Investigation System.

Provides 3D spatial layout, real-time telemetry, active data flows,
and state monitoring for all 24 specialized agents in the agentic network.
"""

import math
import random
import time
from typing import Dict, List, Any


AGENTS_REGISTRY = [
    {
        "id": "coordinator",
        "name": "Coordinator Agent",
        "category": "Orchestration",
        "tier": 1,
        "description": "Identifies the strongest investigation and allocates compute, priority, and attention.",
        "connections": ["explorer", "hypothesis", "investigator", "challenger", "report_generator"],
    },
    {
        "id": "explorer",
        "name": "Explorer Agent",
        "category": "Discovery",
        "tier": 2,
        "description": "Autonomously traverses datasets, codebases, and logs to identify unusual patterns.",
        "connections": ["anomaly_detector", "trend_analyzer", "hypothesis", "search"],
    },
    {
        "id": "hypothesis",
        "name": "Hypothesis Agent",
        "category": "Reasoning",
        "tier": 2,
        "description": "Develops causal explanations and mechanistic dependency models for observed anomalies.",
        "connections": ["investigator", "relationship_discovery", "challenger"],
    },
    {
        "id": "investigator",
        "name": "Investigator Agent",
        "category": "Evidence",
        "tier": 2,
        "description": "Collects concrete multi-source evidence, stack traces, and documents to substantiate hypotheses.",
        "connections": ["code_analysis", "log_analysis", "reader", "database_analysis"],
    },
    {
        "id": "challenger",
        "name": "Challenger Agent",
        "category": "Adversarial",
        "tier": 2,
        "description": "Adversarially attacks hypotheses with negative controls, permutation tests, and FDR correction.",
        "connections": ["fact_checker", "evaluation", "coordinator"],
    },
    {
        "id": "anomaly_detector",
        "name": "Anomaly Detector Agent",
        "category": "Discovery",
        "tier": 3,
        "description": "Applies statistical outlier filters and Minimum Description Length (MDL) noise gating.",
        "connections": ["explorer", "performance_analysis"],
    },
    {
        "id": "trend_analyzer",
        "name": "Trend Analyzer Agent",
        "category": "Discovery",
        "tier": 3,
        "description": "Tracks temporal patterns, recurring incident spikes, and systemic drift over time.",
        "connections": ["explorer", "log_analysis"],
    },
    {
        "id": "relationship_discovery",
        "name": "Relationship Discovery Agent",
        "category": "Reasoning",
        "tier": 3,
        "description": "Maps latent topological connections between seemingly disconnected subsystems.",
        "connections": ["hypothesis", "dependency_analysis"],
    },
    {
        "id": "code_analysis",
        "name": "Code Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Parses Abstract Syntax Trees (AST), control flow graphs, and logic flaws across 15+ languages.",
        "connections": ["investigator", "security_analysis"],
    },
    {
        "id": "log_analysis",
        "name": "Log Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Correlates high-volume distributed logs, unhandled exceptions, and service timeouts.",
        "connections": ["investigator", "api_analysis"],
    },
    {
        "id": "security_analysis",
        "name": "Security Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Identifies credential exposure, token replay exploits, and unauthorized state transitions.",
        "connections": ["challenger", "coordinator"],
    },
    {
        "id": "dependency_analysis",
        "name": "Dependency Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Evaluates package conflicts, transitive vulnerability paths, and binary incompatibilities.",
        "connections": ["code_analysis", "investigator"],
    },
    {
        "id": "performance_analysis",
        "name": "Performance Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Diagnoses CPU throttling, event-loop starvation, memory leaks, and GC pauses.",
        "connections": ["investigator", "database_analysis"],
    },
    {
        "id": "api_analysis",
        "name": "API Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Audits REST/gRPC contracts, schema mismatches, and cascading timeout propagation.",
        "connections": ["investigator", "log_analysis"],
    },
    {
        "id": "database_analysis",
        "name": "Database Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Analyzes slow query plans, deadlocks, connection pool saturation, and indexing gaps.",
        "connections": ["investigator", "performance_analysis"],
    },
    {
        "id": "test_analysis",
        "name": "Test Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Scans flaky unit/integration tests and CI/CD failure clusters.",
        "connections": ["code_analysis", "investigator"],
    },
    {
        "id": "search",
        "name": "Search Agent",
        "category": "Intelligence",
        "tier": 3,
        "description": "Conducts high-speed web and knowledge base retrieval via search APIs.",
        "connections": ["source_evaluator", "reader"],
    },
    {
        "id": "reader",
        "name": "Reader Agent",
        "category": "Intelligence",
        "tier": 3,
        "description": "Deeply scrapes and reads target technical documentation, research papers, and web pages.",
        "connections": ["fact_checker", "investigator"],
    },
    {
        "id": "fact_checker",
        "name": "Fact Checker Agent",
        "category": "Validation",
        "tier": 3,
        "description": "Verifies empirical claims against authoritative sources and historical logs.",
        "connections": ["source_evaluator", "challenger"],
    },
    {
        "id": "source_evaluator",
        "name": "Source Evaluator Agent",
        "category": "Validation",
        "tier": 3,
        "description": "Assesses reliability, integrity, and cryptographic provenance of incoming sources.",
        "connections": ["fact_checker", "explorer"],
    },
    {
        "id": "data_analysis",
        "name": "Data Analysis Agent",
        "category": "Specialized",
        "tier": 3,
        "description": "Executes statistical aggregates, regression tests, and distribution analysis on JSON/CSVs.",
        "connections": ["anomaly_detector", "hypothesis"],
    },
    {
        "id": "evaluation",
        "name": "Evaluation Agent",
        "category": "Validation",
        "tier": 2,
        "description": "Computes evidence strength scores and statistical power for each active inquiry.",
        "connections": ["challenger", "coordinator"],
    },
    {
        "id": "report_generator",
        "name": "Report Generator Agent",
        "category": "Synthesis",
        "tier": 2,
        "description": "Synthesizes multi-agent findings into comprehensive technical and executive reports.",
        "connections": ["critic", "coordinator"],
    },
    {
        "id": "critic",
        "name": "Critic Agent",
        "category": "Synthesis",
        "tier": 2,
        "description": "Strictly audits generated reports, assigning a 10-point rigor score and pinpointing weaknesses.",
        "connections": ["report_generator", "coordinator"],
    },
]

TASK_DESCRIPTIONS = {
    "coordinator": "Prioritizing Funnel #042: Root cause analysis of payment deadlock",
    "explorer": "Scanning 500 MB ingested log batch for stochastic noise patterns",
    "hypothesis": "Synthesizing causal DAG for recurring TCP socket timeout",
    "investigator": "Extracting matching stack traces across 14 microservice pods",
    "challenger": "Executing 5,000 bootstrap permutations on candidate correlation #19",
    "anomaly_detector": "Computing Minimum Description Length (MDL) compressibility on stream",
    "trend_analyzer": "Evaluating 72-hour latency drift following patch v2.4.1",
    "relationship_discovery": "Linking auth token expiration to database pool exhaustion",
    "code_analysis": "Inspecting AST concurrency locks in file_service.py:142",
    "log_analysis": "Clustering 42,000 error lines into 4 distinct fault signatures",
    "security_analysis": "Checking for selective disclosure credential leakage",
    "dependency_analysis": "Resolving transitive version conflict in async transport library",
    "performance_analysis": "Profiling garbage collection latency during 100-funnel stress test",
    "api_analysis": "Auditing HTTP/2 multiplexing dropouts under heavy burst load",
    "database_analysis": "Analyzing index bloat on transactions_log table",
    "test_analysis": "Isolating non-deterministic race condition in integration suite",
    "search": "Retrieving known incident postmortems for similar Envoy proxy crashes",
    "reader": "Parsing PDF specifications for microgrid energy distribution",
    "fact_checker": "Verifying memory consumption metrics against OS telemetry",
    "source_evaluator": "Confirming cryptographic validity of ingested diagnostic telemetry",
    "data_analysis": "Executing Benjamini-Hochberg FDR ranking on 100 hypotheses",
    "evaluation": "Scoring evidence sufficiency for discovery candidate #08 (Score: 9.4/10)",
    "report_generator": "Compiling final PDF investigation report with verified discovery timeline",
    "critic": "Auditing draft report: Validated causal chain; requesting extra negative control",
}


def compute_3d_network_topology() -> Dict[str, Any]:
    """
    Computes a cohesive 3D graph layout with spherical/hierarchical positioning,
    edges, active data flows, and live telemetry for all 24 agents.
    """
    nodes = []
    num_agents = len(AGENTS_REGISTRY)

    # Place coordinator at center (0, 0, 0)
    # Place Tier 2 agents on an inner sphere (radius 180)
    # Place Tier 3 agents on an outer orbital shell (radius 340)
    phi_increment = math.pi * (3.0 - math.sqrt(5.0))  # Golden ratio spiral

    for idx, agent in enumerate(AGENTS_REGISTRY):
        agent_id = agent["id"]
        tier = agent["tier"]

        if agent_id == "coordinator":
            x, y, z = 0.0, 0.0, 0.0
            radius = 0.0
        elif tier == 2:
            radius = 190.0
            idx_in_tier = idx
            y = 1.0 - (idx_in_tier / 7.0) * 2.0  # y goes from 1 to -1
            rad_at_y = math.sqrt(max(0.0, 1.0 - y * y))
            theta = phi_increment * idx_in_tier
            x = math.cos(theta) * rad_at_y * radius
            z = math.sin(theta) * rad_at_y * radius
            y = y * radius
        else:
            radius = 350.0
            idx_in_tier = idx
            y = 1.0 - ((idx_in_tier - 6) / 18.0) * 2.0
            rad_at_y = math.sqrt(max(0.0, 1.0 - y * y))
            theta = phi_increment * idx_in_tier
            x = math.cos(theta) * rad_at_y * radius
            z = math.sin(theta) * rad_at_y * radius
            y = y * radius

        # Status and dynamic activity
        is_active = random.choice([True, True, True, False])  # 75% active currently
        status = "ACTIVE" if is_active else "IDLE"
        current_work = TASK_DESCRIPTIONS.get(agent_id, "Monitoring telemetry streams")
        if not is_active:
            current_work = "Idle (Standing by for new investigation triggers)"

        cognitive_load = random.randint(58, 96) if is_active else random.randint(5, 15)
        tokens_per_sec = random.randint(180, 520) if is_active else 0
        memory_mb = round(random.uniform(14.0, 48.0), 1)

        nodes.append({
            "id": agent_id,
            "name": agent["name"],
            "category": agent["category"],
            "tier": tier,
            "x": round(x, 1),
            "y": round(y, 1),
            "z": round(z, 1),
            "radius": radius,
            "status": status,
            "active": is_active,
            "current_work": current_work,
            "cognitive_load_pct": cognitive_load,
            "tokens_per_sec": tokens_per_sec,
            "memory_mb": memory_mb,
            "connections": agent["connections"],
            "description": agent["description"],
        })

    # Compile edges
    edges = []
    node_map = {n["id"]: n for n in nodes}
    for source in nodes:
        for target_id in source["connections"]:
            if target_id in node_map:
                target = node_map[target_id]
                is_transmitting = source["active"] and target["active"]
                edges.append({
                    "id": f"{source['id']}->{target_id}",
                    "source": source["id"],
                    "target": target_id,
                    "active": is_transmitting,
                    "packet_speed": round(random.uniform(1.2, 3.5), 1),
                    "pulse_intensity": 0.85 if is_transmitting else 0.2,
                })

    active_count = sum(1 for n in nodes if n["active"])
    idle_count = len(nodes) - active_count

    return {
        "status": "success",
        "network_name": "Autonomous Agentic 3D Investigation Topology",
        "total_agents": len(nodes),
        "active_agents": active_count,
        "idle_agents": idle_count,
        "total_edges": len(edges),
        "active_data_flows": sum(1 for e in edges if e["active"]),
        "nodes": nodes,
        "edges": edges,
        "timestamp": time.strftime("%H:%M:%S"),
    }
