
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <h3>Autonomous Investigation</h3>
          <p>
            Explore information, investigate connections and
            develop evidence-based insights.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/login">Login</Link>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Autonomous Investigation. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
