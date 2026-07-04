import { Link } from "react-router-dom";
import "../styles/auth.css";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="login-page-wrap">
      <div className="login-page-card">
        <Link to="/" className="auth-brand-link">
          <div className="auth-brand-logo">N</div>
          <span className="serif auth-brand-name">NikahConnect</span>
        </Link>
        <h1 className="auth-page-title">Welcome back</h1>
        <p className="auth-page-subtitle">Sign in to continue your matrimonial journey</p>
        <LoginForm />
      </div>
    </div>
  );
}
