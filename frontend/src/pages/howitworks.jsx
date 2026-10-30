
const stages = [
  {
    number: "01",
    title: "Research Query",
    description:
      "The user submits a question or investigation topic."
  },
  {
    number: "02",
    title: "Task Decomposition",
    description:
      "The orchestrator divides the investigation into smaller tasks."
  },
  {
    number: "03",
    title: "Multi-Agent Investigation",
    description:
      "Specialized agents examine different aspects of the problem."
  },
  {
    number: "04",
    title: "Evidence Analysis",
    description:
      "Collected information is organized, compared and evaluated."
  },
  {
    number: "05",
    title: "Cross-Verification",
    description:
      "Findings are checked for consistency, contradictions and gaps."
  },
  {
    number: "06",
    title: "Final Report",
    description:
      "The system organizes the investigation into a structured report."
  }
];

function HowItWorks() {
  return (
    <main className="public-page">
      <section className="page-hero">
        <span className="hero-label">THE INVESTIGATION PROCESS</span>
        <h1>How does autonomous investigation work?</h1>
        <p>
          A structured workflow that transforms a research question
          into an organized investigation.
        </p>
      </section>

      <section className="content-section">
        <div className="timeline">
          {stages.map((stage) => (
            <article className="timeline-item" key={stage.number}>
              <div className="timeline-number">{stage.number}</div>
              <div>
                <h3>{stage.title}</h3>
                <p>{stage.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default HowItWorks;
