
import { Link } from "react-router-dom";

function Home() {
  return (
    <main className="home-page">

      <section className="hero">

        <div className="hero-content">

          <span className="hero-label">
            AUTONOMOUS MULTI-AGENT INTELLIGENCE
          </span>

          <h1>
            Discover what
            <br />
            <span>you weren't looking for.</span>
          </h1>

          <p>
            An autonomous investigation platform that explores
            complex information, develops hypotheses, challenges
            assumptions and uncovers connections beyond predefined
            instructions.
          </p>

          <div className="hero-buttons">
            <Link to="/app/explore" className="primary-button">
              Start an Investigation
            </Link>

            <Link to="/how-it-works" className="secondary-button">
              Explore How It Works →
            </Link>
          </div>

        </div>

      </section>

    </main>
  );
}

export default Home;
