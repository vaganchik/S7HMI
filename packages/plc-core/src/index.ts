/**
 * @s7hmi/plc-core - Core S7 protocol & communication primitives
 */

export interface PlcItem {
  name: string;
  addr: string;
  type: string;
}

export interface PlcConnectionOptions {
  host: string;
  port?: number;
  rack?: number;
  slot?: number;
  timeoutMs?: number;
}
