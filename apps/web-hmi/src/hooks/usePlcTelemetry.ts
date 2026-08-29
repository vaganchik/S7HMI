import { useEffect, useState } from 'react';
import { signalRService } from '../services/signalr';
import { TagQuality } from '../types/hmi';
import type { PlcStatus, PlcTagDefinition, TagValue, TagValueUpdate } from '../types/hmi';

const DEFAULT_TAGS: PlcTagDefinition[] = [
  {
    id: 'furnace.zone1.temperature',
    plcId: 'PLC-1',
    name: 'Furnace Zone 1 Temperature',
    description: 'Температура зоны нагрева 1',
    engineeringUnit: '°C',
    minValue: 0,
    maxValue: 1200,
    deadband: 0.1,
    archiveEnabled: true,
    archiveIntervalMs: 1000,
    readOnly: false,
    address: { area: 132, dbNumber: 1, startByte: 0, bitNumber: 0, dataType: 'Real', stringLength: 254 }
  },
  {
    id: 'furnace.zone1.pressure',
    plcId: 'PLC-1',
    name: 'Furnace Pressure',
    description: 'Давление в рабочей камере',
    engineeringUnit: 'bar',
    minValue: 0,
    maxValue: 10,
    deadband: 0.05,
    archiveEnabled: true,
    archiveIntervalMs: 1000,
    readOnly: false,
    address: { area: 132, dbNumber: 1, startByte: 4, bitNumber: 0, dataType: 'Real', stringLength: 254 }
  },
  {
    id: 'furnace.pump.running',
    plcId: 'PLC-1',
    name: 'Cooling Pump Running',
    description: 'Состояние насоса охлаждения',
    deadband: 0,
    archiveEnabled: true,
    archiveIntervalMs: 1000,
    readOnly: false,
    address: { area: 132, dbNumber: 1, startByte: 8, bitNumber: 0, dataType: 'Bool', stringLength: 254 }
  },
  {
    id: 'furnace.valve.open',
    plcId: 'PLC-1',
    name: 'Inlet Valve Open',
    description: 'Положение впускного клапана',
    deadband: 0,
    archiveEnabled: true,
    archiveIntervalMs: 1000,
    readOnly: false,
    address: { area: 132, dbNumber: 1, startByte: 8, bitNumber: 1, dataType: 'Bool', stringLength: 254 }
  }
];

const INITIAL_TAG_VALUES: Record<string, TagValue> = {
  'furnace.zone1.temperature': {
    tagId: 'furnace.zone1.temperature',
    value: 642.5,
    quality: TagQuality.Good,
    timestamp: new Date().toISOString()
  },
  'furnace.zone1.pressure': {
    tagId: 'furnace.zone1.pressure',
    value: 3.42,
    quality: TagQuality.Good,
    timestamp: new Date().toISOString()
  },
  'furnace.pump.running': {
    tagId: 'furnace.pump.running',
    value: true,
    quality: TagQuality.Good,
    timestamp: new Date().toISOString()
  },
  'furnace.valve.open': {
    tagId: 'furnace.valve.open',
    value: true,
    quality: TagQuality.Good,
    timestamp: new Date().toISOString()
  }
};

export function usePlcTelemetry() {
  const [plcStatus, setPlcStatus] = useState<PlcStatus | null>({
    id: 'PLC-1',
    name: 'Siemens S7-1500 Main',
    ipAddress: '192.168.0.1',
    port: 102,
    cpuType: 'S71500',
    isConnected: true,
    lastRoundTripTimeMs: 1.5
  });

  const [tags, setTags] = useState<PlcTagDefinition[]>(DEFAULT_TAGS);
  const [tagValues, setTagValues] = useState<Record<string, TagValue>>(INITIAL_TAG_VALUES);

  useEffect(() => {
    // 1. Initial REST fetch
    fetch('/api/tags')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTags(data);
      })
      .catch(() => {});

    fetch('/api/plc/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setPlcStatus(data);
      })
      .catch(() => {});

    // 2. SignalR subscription
    signalRService.startConnection().catch(console.error);

    signalRService.onTagUpdate((u: TagValueUpdate) => {
      setTagValues((prev) => ({
        ...prev,
        [u.tagId]: { tagId: u.tagId, value: u.value, quality: u.quality, timestamp: u.timestamp }
      }));
    });

    signalRService.onBatchUpdate((updates: TagValueUpdate[]) => {
      setTagValues((prev) => {
        const next = { ...prev };
        for (const u of updates) {
          next[u.tagId] = { tagId: u.tagId, value: u.value, quality: u.quality, timestamp: u.timestamp };
        }
        return next;
      });
    });

    signalRService.onPlcStatus((plcId, isConnected, rttMs) => {
      setPlcStatus((prev) =>
        prev
          ? { ...prev, isConnected, lastRoundTripTimeMs: rttMs }
          : {
              id: plcId,
              name: 'PLC',
              ipAddress: '192.168.0.1',
              port: 102,
              cpuType: 'S71500',
              isConnected,
              lastRoundTripTimeMs: rttMs
            }
      );
    });

    // 3. Fallback smooth simulation timer
    const interval = setInterval(() => {
      setTagValues((prev) => {
        const t = (prev['furnace.zone1.temperature']?.value as number) || 642.0;
        const p = (prev['furnace.zone1.pressure']?.value as number) || 3.4;
        const dt = (Math.random() - 0.48) * 0.6;
        const dp = (Math.random() - 0.49) * 0.04;

        return {
          ...prev,
          'furnace.zone1.temperature': {
            ...prev['furnace.zone1.temperature'],
            value: Number((t + dt).toFixed(1)),
            timestamp: new Date().toISOString()
          },
          'furnace.zone1.pressure': {
            ...prev['furnace.zone1.pressure'],
            value: Number((p + dp).toFixed(2)),
            timestamp: new Date().toISOString()
          }
        };
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const writeTag = async (tagId: string, value: any): Promise<boolean> => {
    setTagValues((prev) => ({
      ...prev,
      [tagId]: {
        tagId,
        value,
        quality: TagQuality.Good,
        timestamp: new Date().toISOString()
      }
    }));
    return await signalRService.writeTagValue(tagId, value);
  };

  const addImportedTags = (newTags: PlcTagDefinition[]) => {
    setTags((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filtered = newTags.filter((t) => !existingIds.has(t.id));
      return [...prev, ...filtered];
    });
  };

  return { plcStatus, tags, tagValues, writeTag, addImportedTags };
}
