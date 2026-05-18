'use client';
import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

export function useRecipeWS({ recipeId, onCommentAdded, onCommentDeleted, onOnlineUsers }) {
  const ws = useRef(null);
  const timer = useRef(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN ||
        ws.current?.readyState === WebSocket.CONNECTING) return;
    try {
      ws.current = new WebSocket(`${WS_BASE}/ws`);

      ws.current.onopen = () => {
        const token = localStorage.getItem('rc_token');
        if (token) {
          ws.current.send(JSON.stringify({ type: 'AUTH', token }));
        } else {
          ws.current.send(JSON.stringify({ type: 'JOIN_RECIPE', recipeId }));
        }
      };

      ws.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'AUTH_OK') {
            ws.current.send(JSON.stringify({ type: 'JOIN_RECIPE', recipeId }));
            return;
          }
          if (msg.type === 'COMMENT_ADDED') onCommentAdded?.(msg.comment);
          if (msg.type === 'COMMENT_DELETED') onCommentDeleted?.(msg.commentId);
          if (msg.type === 'ONLINE_USERS') onOnlineUsers?.(msg.users, msg.count);
        } catch {}
      };

      ws.current.onclose = () => {
        timer.current = setTimeout(connect, 3000);
      };

      ws.current.onerror = () => ws.current?.close();
    } catch {}
  }, [recipeId, onCommentAdded, onCommentDeleted, onOnlineUsers]);

  useEffect(() => {
    connect();

    const handleUnload = () => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'LEAVE_RECIPE', recipeId }));
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('beforeunload', handleUnload);
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'LEAVE_RECIPE', recipeId }));
        ws.current.close();
      }
    };
  }, [connect, recipeId]);

  const broadcastNewComment = useCallback((comment) => {
    if (ws.current?.readyState === WebSocket.OPEN)
      ws.current.send(JSON.stringify({ type: 'NEW_COMMENT', comment }));
  }, []);

  const broadcastDeleteComment = useCallback((commentId) => {
    if (ws.current?.readyState === WebSocket.OPEN)
      ws.current.send(JSON.stringify({ type: 'DELETE_COMMENT', commentId }));
  }, []);

  return { broadcastNewComment, broadcastDeleteComment };
}