import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/auth.css";
import "../../index.css";
import { useAuth } from "../../hooks/useAuth";
import Input from "../shared/Input";
import Select from "../shared/Select";
import Btn from "../shared/Btn";
import Icon from "../shared/Icon";

const initialForm = {
  name: "", email: "", password: "", confirmPassword: "",
  gender: "male", dob: "", country: "", city: "",
};

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(""); // base64 data URL
  const [photoError, setPhotoError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file (JPG, PNG or WEBP).");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("That photo is too large — please pick one under 6MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!photo) {
      setError("Please add a profile photo — real photos get far better responses than a blank profile.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register({ ...payload, photo });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="auth-error"><Icon name="triangle-exclamation" /> {error}</div>}

      {/* Real profile photo — replaces the old auto-generated cartoon avatar. */}
      <div className="register-photo-field">
        <div className="register-photo-preview" onClick={() => fileInputRef.current?.click()}>
          {photo
            ? <img src={photo} alt="Your profile" className="register-photo-img" />
            : <Icon name="camera" size="lg" />
          }
          <div className="register-photo-edit-badge"><Icon name="camera" /></div>
        </div>
        <div className="register-photo-text">
          <div className="register-photo-label">Profile photo</div>
          <div className="register-photo-hint">A real, recent photo of yourself — helps build trust and gets more responses.</div>
          <button type="button" className="register-photo-btn" onClick={() => fileInputRef.current?.click()}>
            {photo ? "Change photo" : "Upload photo"}
          </button>
          {photoError && <div className="register-photo-error">{photoError}</div>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
      </div>

      <Input label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
      <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />

      <div className="form-grid-2">
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" required />
        <Input label="Confirm password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" required />
      </div>

      <div className="form-grid-2">
        <Select label="Gender" name="gender" value={form.gender} onChange={handleChange} options={["male", "female"]} />
        <Input label="Date of birth" type="date" name="dob" value={form.dob} onChange={handleChange} required />
      </div>

      <div className="form-grid-2">
        <Input label="Country" name="country" value={form.country} onChange={handleChange} placeholder="e.g. India" />
        <Input label="City" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Mumbai" />
      </div>

      <Btn type="submit" variant="primary" full disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Btn>

      <div className="auth-footer-text">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </form>
  );
}
