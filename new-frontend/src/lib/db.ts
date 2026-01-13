'use client';

import Dexie, { Table } from 'dexie';
import { ConnectionData, NodeData } from '@/types';

interface PdfCacheEntry {
  url: string;
  blob: Blob;
  updatedAt: number;
}

interface FileContentEntry {
  hash: string;
  blob: Blob;
  mimeType: string;
  updatedAt: number;
}

export class DetectiveDatabase extends Dexie {
  nodes!: Table<NodeData>;
  connections!: Table<ConnectionData>;
  pdfCache!: Table<PdfCacheEntry, string>;
  fileContent!: Table<FileContentEntry, string>;

  constructor() {
    super('DetectiveBoard');
    this.version(1).stores({
      nodes: 'id, type',
      connections: 'id, fromId, toId',
    });
    this.version(2).stores({
      nodes: 'id, type',
      connections: 'id, fromId, toId',
      pdfCache: 'url',
      fileContent: 'hash',
    });
  }
}

export const db = new DetectiveDatabase();
