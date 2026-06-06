'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAssignmentStore } from '@/store/assignmentStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;

export function useWebSocket(assignmentId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const { setWsConnected, setGenerationStatus, updateAssignmentStatus } = useAssignmentStore();

  const connect = useCallback(() => {
    if (!isMounted.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMounted.current) return;
        console.log('✅ WebSocket connected');
        setWsConnected(true);
        reconnectAttempts.current = 0;

        // Subscribe to assignment if provided
        if (assignmentId) {
          ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'status' || msg.type === 'processing') {
            setGenerationStatus({
              status: msg.status,
              progress: msg.progress || 0,
              message: msg.message,
            });
          } else if (msg.type === 'completed') {
            setGenerationStatus({ status: 'completed', progress: 100 });
            if (msg.assignmentId) {
              updateAssignmentStatus(msg.assignmentId, 'completed', msg.questionPaper);
            }
          } else if (msg.type === 'failed') {
            setGenerationStatus({
              status: 'failed',
              progress: 0,
              message: msg.error || 'Generation failed',
            });
            if (msg.assignmentId) {
              updateAssignmentStatus(msg.assignmentId, 'failed');
            }
          }
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };

      ws.onclose = () => {
        if (!isMounted.current) return;
        setWsConnected(false);
        console.log('🔌 WebSocket disconnected');

        // Auto reconnect with exponential backoff
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts.current);
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
          reconnectTimer.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        } else {
          console.log('❌ Max reconnect attempts reached');
        }
      };

      ws.onerror = () => {
        // Silently close — onclose will handle reconnect
        ws.close();
      };

    } catch (err) {
      console.error('WS connection error:', err);
    }
  }, [assignmentId, setWsConnected, setGenerationStatus, updateAssignmentStatus]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return wsRef;
}