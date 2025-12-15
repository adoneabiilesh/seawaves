import { useState, useEffect } from 'react';

interface TableSession {
  id: string;
  sessionToken: string;
  tableNumber: number;
  isActive: boolean;
}

export const useTableSession = (restaurantId: string, tableNumber: number | undefined) => {
  const [session, setSession] = useState<TableSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId || !tableNumber) {
      setIsLoading(false);
      return;
    }

    const createSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/table-sessions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ restaurantId, tableNumber }),
        });

        if (!response.ok) {
          throw new Error('Failed to create table session');
        }

        const data = await response.json();
        setSession(data.session);
        // Store session token in localStorage for persistence
        localStorage.setItem('tableSessionToken', data.sessionToken);
      } catch (err) {
        console.error('Error creating table session:', err);
        setError(err instanceof Error ? err.message : 'Failed to create session');
      } finally {
        setIsLoading(false);
      }
    };

    // Check if there's an existing session
    const existingToken = localStorage.getItem('tableSessionToken');
    if (existingToken) {
      // Verify session is still active
      fetch(`/api/table-sessions/${existingToken}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Session not found');
        })
        .then((data) => {
          if (data.isActive && data.tableNumber === tableNumber) {
            setSession(data);
            setIsLoading(false);
          } else {
            // Create new session if existing one is invalid
            createSession();
          }
        })
        .catch(() => {
          // Create new session if verification fails
          createSession();
        });
    } else {
      createSession();
    }
  }, [restaurantId, tableNumber]);

  const endSession = async () => {
    if (!session) return;

    try {
      await fetch(`/api/table-sessions/${session.sessionToken}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      localStorage.removeItem('tableSessionToken');
      setSession(null);
    } catch (err) {
      console.error('Error ending session:', err);
    }
  };

  return { session, isLoading, error, endSession };
};





