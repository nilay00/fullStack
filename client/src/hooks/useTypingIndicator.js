import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "./useSocket";

const TYPING_TIMEOUT_MS = 2000;

export function useTypingIndicator(conversationId, otherUserId) {
  const { emit, on, off } = useSocket();
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const stopTimeoutRef = useRef(null);

  // Listen for remote typing events
  useEffect(() => {
    if (!conversationId) return;
    const handler = (data) => {
      if (data.conversationId !== conversationId) return;
      if (otherUserId && data.userId !== otherUserId) return;
      setRemoteIsTyping(!!data.isTyping);
      if (data.isTyping) {
        clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = setTimeout(() => setRemoteIsTyping(false), TYPING_TIMEOUT_MS + 500);
      }
    };
    const unsubscribe = on("chat:typing", handler);
    return () => {
      off("chat:typing", handler);
      clearTimeout(stopTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, otherUserId, on, off]);

  // Call this on every keystroke
  const notifyTyping = useCallback(() => {
    if (!conversationId) return;
    emit("chat:typing", { conversationId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emit("chat:typing", { conversationId, isTyping: false });
    }, TYPING_TIMEOUT_MS);
  }, [conversationId, emit]);

  // Call this when sending a message or leaving the chat
  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    clearTimeout(typingTimeoutRef.current);
    emit("chat:typing", { conversationId, isTyping: false });
  }, [conversationId, emit]);

  useEffect(() => () => clearTimeout(typingTimeoutRef.current), []);

  return { remoteIsTyping, notifyTyping, stopTyping };
}
