import "../../styles/shared.css";
import { useNotifications } from "../../hooks/useNotifications";

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} onClick={() => dismissToast(t.id)} className="toast-item">
          <span className="toast-icon">🔔</span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
