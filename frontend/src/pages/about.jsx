
function About() {
  return (
    <main className="public-page">
      <section className="page-hero">
        <span className="hero-label">ABOUT THE PLATFORM</span>
        <h1>Investigation beyond information retrieval.</h1>
        <p>
          Autonomous Investigation is designed to explore complex
          information through structured reasoning, multiple
          investigative perspectives and evidence-based analysis.
        </p>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="hero-label">OUR APPROACH</span>
          <h2>From questions to meaningful insights.</h2>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <span className="card-number">01</span>
            <h3>Explore</h3>
            <p>
              Begin with a research question and identify relevant
              information sources.
            </p>
          </article>

          <article className="info-card">
            <span className="card-number">02</span>
            <h3>Investigate</h3>
            <p>
              Examine information from different perspectives and
              develop possible explanations.
            </p>
          </article>

          <article className="info-card">
            <span className="card-number">03</span>
            <h3>Understand</h3>
            <p>
              Organize findings and present useful conclusions
              supported by evidence.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default About;
