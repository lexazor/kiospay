'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/websocket';

export function useBalance(initialBalance = '0') {
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    const socket = getSocket();

    const onUpdate = (payload: { balance?: string }) => {
      if (payload?.balance !== undefined) {
        setBalance(payload.balance);
      }
    };

    socket.on('balance:updated', onUpdate);

    return () => {
      socket.off('balance:updated', onUpdate);
    };
  }, []);

  return { balance, setBalance };
}