'use client';

import { NodeData } from '@/types';
import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/db';
import styles from './PdfContent.module.css';

interface PdfContentProps {
  node: NodeData;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export function PdfContent({ node, onDoubleClick }: PdfContentProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [Document, setDocument] = useState<any>(null);
  const [Page, setPage] = useState<any>(null);
  const [pdfjs, setPdfjs] = useState<any>(null);

  // Dynamically import react-pdf
  useEffect(() => {
    let isMounted = true;
    
    const loadReactPdf = async () => {
      try {
        const reactPdfModule = await import('react-pdf');
        const pdfjsModule = reactPdfModule.pdfjs;
        
        // Set worker
        pdfjsModule.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsModule.version}/build/pdf.worker.min.js`;
        
        if (isMounted) {
          setDocument(() => reactPdfModule.Document);
          setPage(() => reactPdfModule.Page);
          setPdfjs(pdfjsModule);
        }
      } catch (error) {
        console.error('Failed to load react-pdf:', error);
      }
    };

    loadReactPdf();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let objectUrl: string | null = null;

    const loadPdf = async () => {
      if (!node.pdfSrc) return;
      setPdfData(null);
      setLoadError(null);

      if (node.pdfSrc.startsWith('data:')) {
        setPdfData(node.pdfSrc);
        return;
      }

      let blob: Blob | null = null;

      if (node.pdfSrc.startsWith('asset://')) {
        try {
          const hash = node.pdfSrc.replace('asset://', '');
          const cached = await db.fileContent.get(hash);
          if (cached) blob = cached.blob;
        } catch (e) {
          console.error(e);
        }
      } else {
        if (!node.reloadToken) {
          try {
            const cached = await db.pdfCache.get(node.pdfSrc);
            if (cached) blob = cached.blob;
          } catch (e) {
            console.error(e);
          }
        }

        if (!blob) {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
          const url = `${cleanBase}/api/proxy-pdf?url=${encodeURIComponent(
            node.pdfSrc
          )}${node.reloadToken ? '&refresh=true' : ''}`;

          try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Status ${res.status}`);
            blob = await res.blob();
            if (isMounted) {
              try {
                await db.pdfCache.put({
                  url: node.pdfSrc,
                  blob: blob,
                  updatedAt: Date.now(),
                });
              } catch (e) {
                console.warn(e);
              }
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      if (isMounted) {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setPdfData(objectUrl);
        } else {
          setLoadError('Failed to load PDF');
        }
      }
    };

    loadPdf();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [node.pdfSrc, node.reloadToken]);

  const pdfOptions = useMemo(
    () =>
      pdfjs
        ? {
            cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
            cMapPacked: true,
          }
        : undefined,
    [pdfjs?.version]
  );

  if (!Document || !Page || !pdfjs) {
    return <div className={styles.status}>Loading PDF library...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <span className={styles.label}>PDF</span>
        <div className={styles.controls} onMouseDown={(e) => e.stopPropagation()}>
          <button
            className={styles.button}
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber((p) => p - 1)}
          >
            &lt;
          </button>
          <span>
            {pageNumber} / {numPages || '--'}
          </span>
          <button
            className={styles.button}
            disabled={!numPages || pageNumber >= numPages}
            onClick={() => setPageNumber((p) => p + 1)}
          >
            &gt;
          </button>
          <a
            href={node.pdfSrc}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.externalLink}
          >
            ↗
          </a>
        </div>
      </div>
      <div
        className={`nodrag ${styles.content}`}
        onDoubleClick={onDoubleClick}
      >
        <Document
          file={pdfData}
          options={pdfOptions}
          onLoadSuccess={({ numPages }: { numPages: number }) =>
            setNumPages(numPages)
          }
          loading={<div className={styles.status}>Loading...</div>}
          error={
            <div className={styles.status}>{loadError || 'Error loading PDF'}</div>
          }
        >
          <div className={styles.documentWrapper}>
            <Page
              pageNumber={pageNumber}
              width={(node.width || 300) - 40}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        </Document>
      </div>
    </div>
  );
}
