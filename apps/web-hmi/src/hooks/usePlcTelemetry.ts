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

export function usePlcTelemetry() {
  const [plcStatus, setPlcStatus] = useState<PlcStatus | null>({
    id: 'PLC-1',
    name: 'Siemens S7-1500 Main',
    ipAddress: '192.168.0.1',
    port: 102,
    cpuType: 'S71500',
    isConnected: false,
    lastRoundTripTimeMs: 0
  });

  const [tags, setTags] = useState<PlcTagDefinition[]>(DEFAULT_TAGS);
  const [tagValues, setTagValues] = useState<Record<string, TagValue>>({});

  useEffect(() => {
    let isMounted = true;

    // 1. Первичная загрузка метаданных тегов и статуса через REST
    fetch('/api/tags')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) setTags(data);
      })
      .catch(() => {});

    fetch('/api/tags/values')
      .then((r) => (r.ok ? r.json() : null))
      .then((values) => {
        if (isMounted && values && typeof values === 'object') {
          setTagValues(values);
        }
      })
      .catch(() => {});

    fetch('/api/plc/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (isMounted && data) setPlcStatus(data);
      })
      .catch(() => {});

    // 2. Подключение SignalR для получения live-телеметрии в реальном времени
    signalRService.startConnection().then(() => {
      signalRService.getInitialValues().then((initial) => {
        if (isMounted && initial && Object.keys(initial).length > 0) {
          setTagValues((prev) => ({ ...prev, ...initial }));
        }
      });
    }).catch(console.error);

    signalRService.onTagUpdate((u: TagValueUpdate) => {
      if (!isMounted) return;
      setTagValues((prev) => ({
        ...prev,
        [u.tagId]: { tagId: u.tagId, value: u.value, quality: u.quality, timestamp: u.timestamp }
      }));
    });

    signalRService.onBatchUpdate((updates: TagValueUpdate[]) => {
      if (!isMounted) return;
      setTagValues((prev) => {
        const next = { ...prev };
        for (const u of updates) {
          next[u.tagId] = { tagId: u.tagId, value: u.value, quality: u.quality, timestamp: u.timestamp };
        }
        return next;
      });
    });

    signalRService.onPlcStatus((plcId, isConnected, rttMs) => {
      if (!isMounted) return;
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

    return () => {
      isMounted = false;
    };
  }, []);

  const writeTag = async (tagId: string, value: any): Promise<boolean> => {
    const previousValue = tagValues[tagId];
    
    // Отправляем команду записи на сервер (REST/SignalR)
    const success = await signalRService.writeTagValue(tagId, value);

    if (success) {
      // Обновляем значение только после подтверждения от сервера/ПЛК
      setTagValues((prev) => ({
        ...prev,
        [tagId]: {
          tagId,
          value,
          quality: TagQuality.Good,
          timestamp: new Date().toISOString()
        }
      }));
      return true;
    } else {
      // В случае ошибки восстанавливаем предыдущее состояние
      if (previousValue) {
        setTagValues((prev) => ({
          ...prev,
          [tagId]: previousValue
        }));
      }
      return false;
    }
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
