import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/dashboard.css";
import { timeAgo } from "../../utils/dateHelpers";
import { respondToInterest } from "../../services/interestService";
import Avatar from "../shared/Avatar";
import Btn from "../shared/Btn";

export default function InterestsReceived({ interests, onUpdate, onToast }) {
  const navigate = useNavigate();
  const [busyId, setBusyId] = useState(null);

  const handleRespond = async (id, status) => {
    setBusyId(id);
    try {
      await respondToInterest(id, status);
      onUpdate && onUpdate(id, status);
      onToast && onToast(status === "accepted" ? "Interest accepted" : "Interest declined");
    } catch (err) {
      onToast && onToast(err.response?.data?.message || "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  if (!interests || interests.length === 0) {
    return <div className="interests-empty">No interests received yet.</div>;
  }

  return (
    <div className="interests-list">
      {interests.map((i) => (
        <div key={i._id} className="interest-row">
          <Avatar src={i.from.avatar} name={i.from.name} size={42} />
          <div className="interest-row-info" onClick={() => navigate(`/profile/${i.from._id}`)}>
            <div className="interest-row-name">{i.from.name}, {i.from.age}</div>
            <div className="interest-row-sub">{i.from.country} · {timeAgo(i.createdAt)}</div>
          </div>
          {i.status === "pending" ? (
            <div className="interest-row-actions">
              <Btn size="xs" variant="primary" disabled={busyId === i._id} onClick={() => handleRespond(i._id, "accepted")}>Accept</Btn>
              <Btn size="xs" variant="outline" disabled={busyId === i._id} onClick={() => handleRespond(i._id, "declined")}>Decline</Btn>
            </div>
          ) : (
            <span className={`interest-status-pill ${i.status}`}>
              {i.status === "accepted" ? "✓ Accepted" : "✕ Declined"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
