import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, IconButton, Typography, CircularProgress, Tooltip } from '@mui/material';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface Props {
  url: string;
}

export default function SlideViewer({ url }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null);
  const [pdf, setPdf] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPageNum(1);
    setPdf(null);

    pdfjs.getDocument(url).promise.then((doc) => {
      if (cancelled) return;
      setPdf(doc);
      setNumPages(doc.numPages);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError('PDFを読み込めませんでした');
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [url]);

  const renderPage = useCallback(async (doc: pdfjs.PDFDocumentProxy, num: number) => {
    if (!canvasRef.current || !containerRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const page = await doc.getPage(num);
    const container = containerRef.current;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    const viewport = page.getViewport({ scale: 1 });
    const scaleW = containerW / viewport.width;
    const scaleH = containerH / viewport.height;
    const cssScale = Math.min(scaleW, scaleH) * 0.97;

    // HiDPI: render at physical pixel density, display at CSS size
    const renderScale = cssScale * dpr;
    const scaled = page.getViewport({ scale: renderScale });
    const canvas = canvasRef.current;
    canvas.width = scaled.width;
    canvas.height = scaled.height;
    canvas.style.width = `${Math.round(scaled.width / dpr)}px`;
    canvas.style.height = `${Math.round(scaled.height / dpr)}px`;

    const ctx = canvas.getContext('2d')!;
    const task = page.render({ canvas, canvasContext: ctx, viewport: scaled });
    renderTaskRef.current = task;

    try {
      await task.promise;
    } catch {
      // cancelled — ignore
    }
  }, []);

  useEffect(() => {
    if (!pdf) return;
    renderPage(pdf, pageNum);
  }, [pdf, pageNum, renderPage]);

  useEffect(() => {
    if (!pdf) return;
    const observer = new ResizeObserver(() => renderPage(pdf, pageNum));
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [pdf, pageNum, renderPage]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        setPageNum((p) => Math.min(p + 1, numPages));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setPageNum((p) => Math.max(p - 1, 1));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [numPages]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#1e1e2e', borderRadius: 1, overflow: 'hidden' }}>
      {/* スライドエリア */}
      <Box
        ref={containerRef}
        sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', p: 2 }}
      >
        {loading && <CircularProgress sx={{ color: 'grey.400' }} />}
        {error && (
          <Typography color="error.light" variant="body2">{error}</Typography>
        )}
        {!loading && !error && (
          <canvas
            ref={canvasRef}
            style={{ maxWidth: '100%', maxHeight: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.6)', borderRadius: 4 }}
          />
        )}
      </Box>

      {/* ナビゲーションバー */}
      {numPages > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            py: 1,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            bgcolor: 'rgba(0,0,0,0.3)',
          }}
        >
          <Tooltip title="前のスライド (←)">
            <span>
              <IconButton
                size="small"
                onClick={() => setPageNum((p) => Math.max(p - 1, 1))}
                disabled={pageNum <= 1}
                sx={{ color: 'grey.300', '&:disabled': { opacity: 0.3 } }}
              >
                <NavigateBeforeIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Typography variant="body2" sx={{ color: 'grey.300', minWidth: 64, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {pageNum} / {numPages}
          </Typography>

          <Tooltip title="次のスライド (→)">
            <span>
              <IconButton
                size="small"
                onClick={() => setPageNum((p) => Math.min(p + 1, numPages))}
                disabled={pageNum >= numPages}
                sx={{ color: 'grey.300', '&:disabled': { opacity: 0.3 } }}
              >
                <NavigateNextIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}
