import { useState, useEffect } from 'react';
import { RespostaPronta } from '@/types';
import { respostasProntasBase } from '@/data/mockData';
import { safeStorage } from '@/lib/safeStorage';

const RESPOSTAS_KEY = 'plataforma_respostas_prontas';

export function useRespostasProntas() {
  const [respostas, setRespostas] = useState<RespostaPronta[]>([]);

  useEffect(() => {
    const stored = safeStorage.getItem(RESPOSTAS_KEY);
    if (stored) {
      setRespostas(JSON.parse(stored));
    } else {
      setRespostas(respostasProntasBase);
      safeStorage.setItem(RESPOSTAS_KEY, JSON.stringify(respostasProntasBase));
    }
  }, []);

  const saveRespostas = (newRespostas: RespostaPronta[]) => {
    setRespostas(newRespostas);
    safeStorage.setItem(RESPOSTAS_KEY, JSON.stringify(newRespostas));
  };

  const addResposta = (texto: string) => {
    const newId = Math.max(...respostas.map(r => r.id), 0) + 1;
    saveRespostas([...respostas, { id: newId, texto }]);
  };

  const updateResposta = (id: number, texto: string) => {
    saveRespostas(respostas.map(r => r.id === id ? { ...r, texto } : r));
  };

  const deleteResposta = (id: number) => {
    saveRespostas(respostas.filter(r => r.id !== id));
  };

  return {
    respostas,
    addResposta,
    updateResposta,
    deleteResposta
  };
}
