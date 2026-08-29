import * as signalR from '@microsoft/signalr';
import type { TagValue, TagValueUpdate } from '../types/hmi';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private onTagUpdateCallbacks: ((update: TagValueUpdate) => void)[] = [];
  private onBatchUpdateCallbacks: ((updates: TagValueUpdate[]) => void)[] = [];
  private onPlcStatusCallbacks: ((plcId: string, isConnected: boolean, rttMs: number) => void)[] = [];

  public async startConnection(): Promise<void> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('/hmihub')
      .withAutomaticReconnect([0, 1000, 3000, 5000, 10000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.on('TagUpdated', (update: TagValueUpdate) => {
      this.onTagUpdateCallbacks.forEach((cb) => cb(update));
    });

    this.connection.on('BatchTagsUpdated', (updates: TagValueUpdate[]) => {
      this.onBatchUpdateCallbacks.forEach((cb) => cb(updates));
    });

    this.connection.on('PlcStatusChanged', (plcId: string, isConnected: boolean, rttMs: number) => {
      this.onPlcStatusCallbacks.forEach((cb) => cb(plcId, isConnected, rttMs));
    });

    try {
      await this.connection.start();
      console.log('SignalR connected to /hmihub');
    } catch (err) {
      console.warn('SignalR connection failed, will retry in background:', err);
    }
  }

  public async getInitialValues(): Promise<Record<string, TagValue>> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return {};
    }
    return await this.connection.invoke('GetInitialValues');
  }

  public async writeTagValue(tagId: string, value: any): Promise<boolean> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      const res = await fetch(`/api/tags/${encodeURIComponent(tagId)}/write`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      return res.ok;
    }
    return await this.connection.invoke('WriteTagValue', tagId, value);
  }

  public onTagUpdate(cb: (update: TagValueUpdate) => void) {
    this.onTagUpdateCallbacks.push(cb);
  }

  public onBatchUpdate(cb: (updates: TagValueUpdate[]) => void) {
    this.onBatchUpdateCallbacks.push(cb);
  }

  public onPlcStatus(cb: (plcId: string, isConnected: boolean, rttMs: number) => void) {
    this.onPlcStatusCallbacks.push(cb);
  }
}

export const signalRService = new SignalRService();
