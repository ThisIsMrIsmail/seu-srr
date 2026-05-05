import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspaceContext } from '../context/WorkspaceContext';

function deriveWorkspaceName(fileName) {
  return (
    String(fileName || '')
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Semester Workspace'
  );
}

export function useExcelParser() {
  const { actions } = useWorkspaceContext();
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState('');
  const [pendingFileName, setPendingFileName] = useState('');
  const workerRef = useRef(null);
  const latestParseIdRef = useRef(0);
  const pendingWorkspaceNameRef = useRef('');
  const pendingFileNameRef = useRef('');

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/excelParser.worker.js', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    const handleMessage = (event) => {
      const { type, payload, error: workerError, parseId } = event.data ?? {};

      if (parseId !== latestParseIdRef.current) {
        return;
      }

      if (type === 'success') {
        actions.createWorkspace({
          ...payload,
          fileName: pendingFileNameRef.current,
          name: pendingWorkspaceNameRef.current,
        });
        setError('');
        setIsParsing(false);
        setPendingFileName('');
        pendingFileNameRef.current = '';
        pendingWorkspaceNameRef.current = '';
        return;
      }

      if (type === 'error') {
        setError(workerError || 'Unable to parse the selected workbook.');
        setIsParsing(false);
        setPendingFileName('');
      }
    };

    worker.addEventListener('message', handleMessage);

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
    };
  }, [actions]);

  const parseFile = useCallback(async (file) => {
    if (!/\.xlsx?$/i.test(file.name)) {
      setError('Please upload a valid Excel workbook (.xlsx or .xls).');
      return;
    }

    if (!workerRef.current) {
      setError('The parser is not ready yet. Please try again.');
      return;
    }

    const parseId = latestParseIdRef.current + 1;
    latestParseIdRef.current = parseId;
    pendingWorkspaceNameRef.current = deriveWorkspaceName(file.name);
    pendingFileNameRef.current = file.name;
    setPendingFileName(file.name);
    setError('');
    setIsParsing(true);

    try {
      const buffer = await file.arrayBuffer();
      await new Promise((resolve) => requestAnimationFrame(resolve));
      workerRef.current.postMessage({ buffer, parseId }, [buffer]);
    } catch (err) {
      setIsParsing(false);
      setError(err instanceof Error ? err.message : 'Unable to read the selected workbook.');
    }
  }, []);

  return { isParsing, error, pendingFileName, parseFile };
}
