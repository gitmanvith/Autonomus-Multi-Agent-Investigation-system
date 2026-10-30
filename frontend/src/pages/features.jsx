
const features = [
  {
    icon: "⌕",
    title: "Intelligent Exploration",
    description:
      "Start investigations using natural-language research questions."
  },
  {
    icon: "◎",
    title: "Multi-Agent Architecture",
    description:
      "Coordinate specialized agents to investigate different aspects of a task."
  },
  {
    icon: "◇",
    title: "Hypothesis Development",
    description:
      "Develop and examine possible explanations during an investigation."
  },
  {
    icon: "⇄",
    title: "Cross-Verification",
    description:
      "Compare findings and identify contradictions or missing information."
  },
  {
    icon: "▤",
    title: "Structured Reports",
    description:
      "Organize investigation results into readable reports."
  },
  {
    icon: "⌘",
    title: "Investigation History",
    description:
      "Keep track of previously created investigations."
  }
];

function Features() {
  return (
    <main className="public-page">
      <section className="page-hero">
        <span className="hero-label">PLATFORM CAPABILITIES</span>
        <h1>Designed for deeper investigation.</h1>
        <p>
          A collection of capabilities intended to support
          systematic research and information analysis.
        </p>
      </section>

      <section className="content-section">
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Features;
