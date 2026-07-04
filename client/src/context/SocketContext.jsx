import { createContext, useEffect, useRef, useState, useCallback, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContext";
import { getConversations } from "../services/messageService";

export const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export function SocketProvider({ children }) {
  const { token, user } = useContext(AuthContext);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [totalUnread, setTotalUnread] = useState(0);

  // Load initial unread count from conversations
  const loadUnread = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getConversations();
      const total = data.conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
      setTotalUnread(total);
    } catch (_) {}
  }, [token]);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
        setTotalUnread(0);
      }
      return;
    }

    loadUnread();

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("presence:update", ({ userId, isOnline }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    // Increment unread count when a new message arrives for us
    socket.on("chat:message", (msg) => {
      // Only count if this message is NOT from ourselves
      if (String(msg.sender?.id) !== String(user._id)) {
        setTotalUnread((prev) => prev + 1);
      }
    });

    // When user reads a conversation, reload to get accurate counts
    socket.on("chat:read", () => {
      loadUnread();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?._id]);

  const clearUnread = useCallback(() => {
    setTotalUnread(0);
  }, []);

  const emit = useCallback((event, payload, callback) => {
    if (socketRef.current) socketRef.current.emit(event, payload, callback);
  }, []);

  const on = useCallback((event, handler) => {
    if (socketRef.current) socketRef.current.on(event, handler);
    return () => {
      if (socketRef.current) socketRef.current.off(event, handler);
    };
  }, []);

  const off = useCallback((event, handler) => {
    if (socketRef.current) socketRef.current.off(event, handler);
  }, []);

  const isOnline = useCallback((userId) => onlineUserIds.has(String(userId)), [onlineUserIds]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, emit, on, off, isOnline, onlineUserIds, totalUnread, clearUnread }}>
      {children}
    </SocketContext.Provider>
  );
}
