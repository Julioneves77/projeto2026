import { useState, useEffect, useRef, useCallback } from 'react';

export interface ColumnWidths {
  codigo: number;
  cpf: number;
  nomeTelefone: number;
  cadastro: number;
  atribuicao: number;
  finalizacao: number;
  status: number;
  operador: number;
  prioridade: number;
  acoes: number;
}

const DEFAULT_WIDTHS: ColumnWidths = {
  codigo: 96,
  cpf: 128,
  nomeTelefone: 200,
  cadastro: 96,
  atribuicao: 96,
  finalizacao: 96,
  status: 128,
  operador: 112,
  prioridade: 96,
  acoes: 80,
};

const STORAGE_KEY = 'av_table_column_widths';
const MIN_WIDTH = 50;
const MAX_WIDTH = 500;

export function useColumnResize() {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(DEFAULT_WIDTHS);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<keyof ColumnWidths | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const tableRef = useRef<HTMLTableElement | null>(null);

  // Carregar larguras salvas do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validar que todas as chaves existem
        const validWidths: ColumnWidths = { ...DEFAULT_WIDTHS };
        Object.keys(DEFAULT_WIDTHS).forEach((key) => {
          if (parsed[key] && typeof parsed[key] === 'number' && parsed[key] >= MIN_WIDTH && parsed[key] <= MAX_WIDTH) {
            validWidths[key as keyof ColumnWidths] = parsed[key];
          }
        });
        setColumnWidths(validWidths);
      }
    } catch (error) {
      console.warn('Erro ao carregar larguras de colunas:', error);
    }
  }, []);

  // Salvar larguras no localStorage
  const saveWidths = useCallback((widths: ColumnWidths) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widths));
    } catch (error) {
      console.warn('Erro ao salvar larguras de colunas:', error);
    }
  }, []);

  // Iniciar redimensionamento
  const handleResizeStart = useCallback((column: keyof ColumnWidths, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizingColumn(column);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[column];
    
    // Prevenir seleção de texto
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [columnWidths]);

  // Atualizar durante redimensionamento
  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizingColumn) return;

    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + deltaX));

    setColumnWidths((prev) => {
      const updated = { ...prev, [resizingColumn]: newWidth };
      return updated;
    });
  }, [isResizing, resizingColumn]);

  // Finalizar redimensionamento
  const handleResizeEnd = useCallback(() => {
    if (!isResizing) return;

    setIsResizing(false);
    setResizingColumn(null);
    
    // Restaurar seleção de texto e cursor
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.classList.remove('resizing');
    
    // Salvar no localStorage
    setColumnWidths((current) => {
      saveWidths(current);
      return current;
    });
  }, [isResizing, saveWidths]);

  // Auto-ajustar por duplo clique
  const handleDoubleClick = useCallback((column: keyof ColumnWidths, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!tableRef.current) return;

    // Encontrar o índice da coluna
    const columnKeys: (keyof ColumnWidths)[] = [
      'codigo',
      'cpf',
      'nomeTelefone',
      'cadastro',
      'atribuicao',
      'finalizacao',
      'status',
      'operador',
      'prioridade',
      'acoes',
    ];
    
    const columnIndex = columnKeys.indexOf(column);
    if (columnIndex === -1) return;

    // Encontrar todas as células da coluna (header + body)
    const headerCell = tableRef.current.querySelector(`thead tr th:nth-child(${columnIndex + 1})`);
    const bodyCells = tableRef.current.querySelectorAll(`tbody tr td:nth-child(${columnIndex + 1})`);

    let maxWidth = 0;

    // Calcular largura do header
    if (headerCell) {
      const headerRect = headerCell.getBoundingClientRect();
      maxWidth = Math.max(maxWidth, headerRect.width);
    }

    // Calcular largura máxima das células do body
    bodyCells.forEach((cell) => {
      const cellRect = cell.getBoundingClientRect();
      const cellContent = cell.textContent || '';
      // Estimar largura baseada no conteúdo (aproximação)
      const estimatedWidth = cellContent.length * 8 + 24; // 8px por caractere + padding
      maxWidth = Math.max(maxWidth, estimatedWidth, cellRect.width);
    });

    // Aplicar largura com margem de segurança
    const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, maxWidth + 20));

    setColumnWidths((prev) => {
      const updated = { ...prev, [column]: newWidth };
      saveWidths(updated);
      return updated;
    });
  }, []);

  // Adicionar listeners globais para mousemove e mouseup
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResize, handleResizeEnd]);

  return {
    columnWidths,
    isResizing,
    resizingColumn,
    tableRef,
    handleResizeStart,
    handleDoubleClick,
  };
}

