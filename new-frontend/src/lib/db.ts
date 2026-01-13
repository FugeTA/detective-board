'use client';

import Dexie, { Table } from 'dexie';
import { ConnectionData, NodeData } from '@/types';

export class DetectiveDatabase extends Dexie {
  nodes!: Table<NodeData>;
  connections!: Table<ConnectionData>;

  constructor() {
    super('DetectiveBoard');
    this.version(1).stores({
      nodes: 'id, type',
      connections: 'id, fromId, toId',
    });
  }
}

export const db = new DetectiveDatabase();
