
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <div className="nav-logo">
        <span className="logo-mark">A</span>
        <span>Autonomous Investigation</span>
      </div>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/how-it-works">How It Works</Link>
        <Link to="/features">Features</Link>
      </div>

      <div className="nav-actions">
        <Link to="/login" className="login-link">
          Login
        </Link>

        <Link to="/app/explore" className="get-started">
          Get Started
        </Link>
      </div>

    </nav>
  );
}

export default Navbar;
