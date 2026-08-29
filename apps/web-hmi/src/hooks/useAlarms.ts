import { useEffect, useState } from 'react';

export function useAlarms() {
  const [activeAlarmCount, setActiveAlarmCount] = useState(0);

  const fetchActiveAlarms = async () => {
    try {
      const res = await fetch('/api/alarms/active');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setActiveAlarmCount(data.length);
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    fetchActiveAlarms();
    const interval = setInterval(fetchActiveAlarms, 2000);
    return () => clearInterval(interval);
  }, []);

  return { activeAlarmCount, refreshAlarms: fetchActiveAlarms };
}
