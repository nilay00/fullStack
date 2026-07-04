import { useState } from "react";
import "../../styles/report.css";
import { submitReport } from "../../services/reportService";
import Btn from "../shared/Btn";

const REASONS = [
  { value: "fake_profile", label: "Fake / misleading profile" },
  { value: "harassment", label: "Harassment or threats" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "spam", label: "Spam or scam" },
  { value: "other", label: "Other" },
];

export default function ReportModal({ reportedUserId, reportedName, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason."); return; }
    setSubmitting(true);
    setError("");
    try {
      await submitReport({ reported: reportedUserId, reason, details });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="report-success-box">
            <div className="report-success-icon">✅</div>
            <div className="report-success-text">
              Report submitted. Our team will review <strong>{reportedName}</strong>'s profile within 24 hours. Thank you for keeping NikahConnect safe.
            </div>
            <Btn variant="primary" size="sm" onClick={onClose} className="report-close-btn">Close</Btn>
          </div>
        ) : (
          <>
            <div className="report-modal-title">🚩 Report {reportedName}</div>
            <div className="report-modal-subtitle">Help us keep the community safe. Tell us what's wrong.</div>

            <div className="report-reason-grid">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  className={`report-reason-btn${reason === r.value ? " selected" : ""}`}
                  onClick={() => setReason(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="report-details-label">Additional details (optional)</div>
            <textarea
              className="report-details-input"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe what happened…"
            />

            {error && <div className="report-error">{error}</div>}

            <div className="report-modal-actions">
              <Btn variant="outline" onClick={onClose}>Cancel</Btn>
              <Btn variant="danger" disabled={submitting} onClick={handleSubmit}>
                {submitting ? "Submitting…" : "Submit report"}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
