
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setMessage("Please enter your email and password.");
      return;
    }

    setMessage(
      "Demo form submitted. Connect your backend to enable real login."
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="logo-mark">A</span>
          Autonomous Investigation
        </Link>

        <h1>Welcome back</h1>
        <p>Sign in to access your investigation workspace.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email address</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" className="primary-button auth-submit">
            Sign In
          </button>
        </form>

        {message && <p className="form-message">{message}</p>}

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
