import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ExternalLink } from 'lucide-react';
import styles from './PdfContent.module.css';
import clsx from 'clsx';
import { db } from '../../db';

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
};

const PdfContent = ({ node, isSpacePressed, onImageDoubleClick }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadPdf = async () => {
      if (!node.pdfSrc) return;
      setPdfData(null);
      setLoadError(null);

      if (node.pdfSrc.startsWith('data:')) {
        setPdfData(node.pdfSrc);
        return;
      }

      let blob = null;

      if (!node.reloadToken || node.pdfSrc.startsWith('asset://')) {
        try {
          const cached = await db.pdfCache.get(node.pdfSrc);
          if (cached) blob = cached.blob;
        } catch (e) { console.error(e); }
      }

      if (!blob && !node.pdfSrc.startsWith('asset://')) {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        const url = `${cleanBase}/api/proxy-pdf?url=${encodeURIComponent(node.pdfSrc)}${node.reloadToken ? '&refresh=true' : ''}`;
        
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Status ${res.status}`);
          blob = await res.blob();
          if (isMounted) {
            try {
              await db.pdfCache.put({ url: node.pdfSrc, blob: blob, updatedAt: Date.now() });
            } catch (e) { console.warn(e); }
          }
        } catch (e) { console.error(e); }
      }

      if (isMounted) {
        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setPdfData(objectUrl);
        } else {
          setLoadError("Failed to load PDF");
        }
      }
    };

    loadPdf();
    return () => {
      isMounted = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [node.pdfSrc, node.reloadToken]);

  return (
    <div className={styles.container}>
      <div className={clsx(styles.toolbar, isSpacePressed ? styles.grab : styles.move)}>
         <span className={styles.label}>PDF</span>
         <div className={styles.controls} onMouseDown={e => e.stopPropagation()}>
           <button className={styles.button} disabled={pageNumber<=1} onClick={()=>setPageNumber(p=>p-1)}>&lt;</button>
           <span>{pageNumber} / {numPages||'--'}</span>
           <button className={styles.button} disabled={pageNumber>=numPages} onClick={()=>setPageNumber(p=>p+1)}>&gt;</button>
           <a href={node.pdfSrc} target="_blank" rel="noopener noreferrer" className={styles.externalLink}><ExternalLink size={16} /></a>
         </div>
      </div>
      <div className={clsx("nodrag", styles.content)} onDoubleClick={(e) => onImageDoubleClick && onImageDoubleClick(e, node)}>
         <Document file={pdfData} options={pdfOptions} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<div className={styles.status}>Loading...</div>} error={<div className={styles.status}>{loadError || 'Error loading PDF'}</div>}>
            <div className={styles.documentWrapper}><Page pageNumber={pageNumber} width={node.width - 40} renderTextLayer={true} renderAnnotationLayer={true} /></div>
         </Document>
      </div>
    </div>
  );
};
export default PdfContent;