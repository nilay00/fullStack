import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";
import { useAuth } from "../../hooks/useAuth";
import Input from "../shared/Input";
import Btn from "../shared/Btn";

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="auth-error">{error}</div>}
      <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
      <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
      <Btn type="submit" variant="primary" full disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Btn>
      <div className="auth-footer-text">
        Don't have an account? <Link to="/register">Create one</Link>
      </div>
    </form>
  );
}
