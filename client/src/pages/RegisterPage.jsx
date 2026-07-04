import { Link } from "react-router-dom";
import "../styles/auth.css";
import "../index.css";
import RegisterForm from "../components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="register-page-wrap">
      <div className="fade-in register-container">
        <Link to="/" className="auth-brand-link">
          <div className="auth-brand-logo">N</div>
          <span className="serif auth-brand-name">NikahConnect</span>
        </Link>
        <div className="register-page-card">
          <h1 className="auth-page-title">Create your profile</h1>
          <p className="auth-page-subtitle">Join a trusted community of practising Muslims</p>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
