'use client';

import React, { useRef } from 'react';
import { NodeData, NodeType } from '@/types';

interface ContextMenu {
  x: number;
  y: number;
  nodeId?: string;
}

interface ContextMenuProps {
  menu: ContextMenu | null;
  onClose: () => void;
  nodes: NodeData[];
  selectedIds: Set<string>;
  onDelete: () => void;
  onDuplicate: () => void;
  onCreateNode?: (type: NodeType, position: { x: number; y: number }) => void;
  onSetLink?: (nodeId: string) => void;
  onUploadFile?: (nodeId: string, file: File) => void;
}

export function ContextMenu({
  menu,
  onClose,
  nodes,
  selectedIds,
  onDelete,
  onDuplicate,
  onCreateNode,
  onSetLink,
  onUploadFile,
}: ContextMenuProps) {
  if (!menu) return null;

  const node = menu.nodeId ? nodes.find((n) => n.id === menu.nodeId) : null;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const acceptMap: Partial<Record<NodeType, string>> = {
    image: 'image/*',
    audio: 'audio/*',
    video: 'video/*',
    pdf: 'application/pdf',
  };

  const handleUploadClick = () => {
    if (!node) return;
    const input = fileInputRef.current;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file && node && onUploadFile) {
      onUploadFile(node.id, file);
    }
    e.target.value = '';
    onClose();
  };

  const handleSetLink = () => {
    if (node && onSetLink) {
      onSetLink(node.id);
    }
    onClose();
  };

  // ノードを作成するためのヘルパー関数
  const handleCreateNode = (type: NodeType) => {
    if (onCreateNode) {
      // 画面座標をボード座標に変換する必要があるが、ここでは簡易的に画面座標を使用
      onCreateNode(type, { x: menu.x, y: menu.y });
    }
    onClose();
  };

  const menuButtonStyle = {
    width: '100%',
    padding: '8px 12px',
    border: 'none',
    background: 'none',
    textAlign: 'left' as const,
    fontSize: 14,
    color: '#374151',
    cursor: 'pointer',
    transition: 'background 0.15s',
  };

  const deleteButtonStyle = {
    ...menuButtonStyle,
    color: '#ef4444',
  };

  return (
    <>
      {/* 背景クリックで閉じる */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
        }}
        onClick={onClose}
      />

      {/* メニュー */}
      <div
        style={{
          position: 'fixed',
          left: menu.x,
          top: menu.y,
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: 180,
          overflow: 'hidden',
        }}
      >
          {node && node.type !== 'text' && (
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <button
                onClick={handleSetLink}
                style={menuButtonStyle}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'none';
                }}
              >
                🔗 リンクから読み込む
              </button>
              <button
                onClick={handleUploadClick}
                style={menuButtonStyle}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'none';
                }}
              >
                📁 ローカルファイルをアップロード
              </button>
            </div>
          )}

        {node && (
          <div
            style={{
              padding: '4px 0',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                fontSize: 12,
                color: '#6b7280',
                fontWeight: 600,
              }}
            >
              {node.title}
            </div>
          </div>
        )}

        {/* ノードが選択されている場合のメニュー */}
        {node && (
          <>
            <button
              onClick={() => {
                onDuplicate();
                onClose();
              }}
              style={menuButtonStyle}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              複製
            </button>

            <button
              onClick={() => {
                onDelete();
                onClose();
              }}
              style={deleteButtonStyle}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#fee2e2';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              削除
            </button>
          </>
        )}

        {/* ノードが選択されていない場合（空白部分を右クリック）のメニュー */}
        {!node && onCreateNode && (
          <>
            <div
              style={{
                padding: '8px 12px',
                fontSize: 12,
                color: '#6b7280',
                fontWeight: 600,
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              ノードを作成
            </div>
            
            <button
              onClick={() => handleCreateNode('text')}
              style={menuButtonStyle}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              📝 テキストノード
            </button>

            <button
              onClick={() => handleCreateNode('image')}
              style={menuButtonStyle}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              🖼️ 画像ノード
            </button>

            <button
              onClick={() => handleCreateNode('pdf')}
              style={menuButtonStyle}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              📄 PDFノード
            </button>

            <button
              onClick={() => handleCreateNode('audio')}
              style={menuButtonStyle}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              🎵 オーディオノード
            </button>

            <button
              onClick={() => handleCreateNode('video')}
              style={menuButtonStyle}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'none';
              }}
            >
              🎬 ビデオノード
            </button>
          </>
        )}
      </div>

      {node && (
        <input
          ref={fileInputRef}
          type="file"
          accept={node.type ? acceptMap[node.type] : undefined}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}
    </>
  );
}
