import { createContext, useState, useEffect, useCallback, useContext, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { SocketContext } from "./SocketContext";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../services/notificationService";

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  // Keep a ref to latest socket so the effect always has the current one
  const socketRef = useRef(socket);
  useEffect(() => { socketRef.current = socket; }, [socket]);

  const pushToast = useCallback((message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (_) {}
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Listen directly on the socket object — more reliable than the on/off helpers
  useEffect(() => {
    if (!socket) return;

    const handleNew = (notif) => {
      setNotifications(prev => {
        // deduplicate by id
        const id = notif._id || notif.id;
        if (prev.some(n => (n._id || n.id) === id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount(prev => prev + 1);
      pushToast(notif.text);
    };

    socket.on("notification:new", handleNew);
    return () => { socket.off("notification:new", handleNew); };
  }, [socket, pushToast]);

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => ((n._id || n.id) === id ? { ...n, read: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try { await markNotificationRead(id); } catch (_) {}
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try { await markAllNotificationsRead(); } catch (_) {}
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, toasts, pushToast, dismissToast, markRead, markAllRead, reload: loadNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}
