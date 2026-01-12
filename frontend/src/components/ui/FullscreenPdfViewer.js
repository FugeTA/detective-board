import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { db } from '../../db';
import styles from './FullscreenPdfViewer.module.css';

const pdfOptions = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
};

const FullscreenPdfViewer = ({ src, reloadToken, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfData, setPdfData] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [initialScale, setInitialScale] = useState(null);
  const containerRef = useRef(null);
  const [isInitialScaleSet, setIsInitialScaleSet] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadPdf = async () => {
      if (!src) return;
      setPdfData(null);

      if (src.startsWith('data:')) {
        if (isMounted) setPdfData(src);
        return;
      }

      let blob = null;

      if (!reloadToken || src.startsWith('asset://')) {
        try {
          const cached = await db.pdfCache.get(src);
          if (cached) blob = cached.blob;
        } catch (e) { console.error(e); }
      }

      if (!blob) {
        const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
        
        if (!src.startsWith('asset://')) {
          const url = `${cleanBase}/api/proxy-pdf?url=${encodeURIComponent(src)}${reloadToken ? '&refresh=true' : ''}`;
          try {
            const res = await fetch(url);
            if (res.ok) {
              blob = await res.blob();
            }
          } catch (e) { console.error(e); }
        } else {
          // Asset URL not found in cache - notify user
          console.error(`Asset not found in cache: ${src}`);
          if (onError) onError(new Error('Asset not found in cache'));
        }
      }

      if (isMounted && blob) {
        objectUrl = URL.createObjectURL(blob);
        setPdfData(objectUrl);
      }
    };
    loadPdf();
    return () => { 
      isMounted = false; 
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, reloadToken]);

  useEffect(() => {
    setIsInitialScaleSet(false);
    setScale(1.0);
    setInitialScale(null);
  }, [src]);

  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY * -0.002;
    setScale(prev => Math.min(Math.max(0.1, prev + delta), 5.0));
  };

  const onPageLoadSuccess = (page) => {
    if (!isInitialScaleSet && containerRef.current) {
      const viewport = page.getViewport({ scale: 1 });
      const containerHeight = containerRef.current.clientHeight;
      const containerWidth = containerRef.current.clientWidth;
      const newScale = Math.min((containerHeight - 40) / viewport.height, (containerWidth - 40) / viewport.width);
      setScale(newScale);
      setInitialScale(newScale);
      setIsInitialScaleSet(true);
    }
  };

  return (
    <div className={styles.container} onClick={e => e.stopPropagation()}>
      <div className={styles.toolbar}>
         <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber<=1}>Prev</button>
         <span>{pageNumber} / {numPages || '--'}</span>
         <button onClick={() => setPageNumber(p => Math.min(numPages, p + 1))} disabled={pageNumber>=numPages}>Next</button>
         <div style={{width: '20px'}}></div>
         <button onClick={() => initialScale && setScale(initialScale)} disabled={!initialScale}>Reset Zoom</button>
         <div style={{flex: 1}}></div>
         <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
      <div className={styles.content} ref={containerRef} onWheel={handleWheel}>
         {pdfData && (
           <Document file={pdfData} onLoadSuccess={({ numPages }) => setNumPages(numPages)} options={pdfOptions}>
              <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} onLoadSuccess={onPageLoadSuccess} />
           </Document>
         )}
         {!pdfData && <div className={styles.loading}>Loading PDF...</div>}
      </div>
    </div>
  );
};

export default FullscreenPdfViewer;