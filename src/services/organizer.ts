import { AlertaSequencia, DadosOrganizados, NotaFiscal } from '../types';

const formatMonth = (date: Date): string => {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${year}`;
};

const calculateMissingNumbers = (numbers: number[]): number[] => {
  if (numbers.length === 0) return [];
  const sorted = Array.from(new Set(numbers)).sort((a, b) => a - b);
  const missing: number[] = [];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  for (let n = min; n <= max; n += 1) {
    if (!sorted.includes(n)) {
      missing.push(n);
    }
  }
  return missing;
};

export const organizarDados = (notas: NotaFiscal[], mesSelecionado: string): DadosOrganizados => {
  const notasDoMes = notas.filter((nota) => formatMonth(nota.dataEmissao) === mesSelecionado);

  const agrupar = (modelo: 55 | 65, status: 'processado' | 'cancelado') =>
    notasDoMes.filter((nota) => nota.modelo === modelo && nota.status === status);

  const nfeProcessados = agrupar(55, 'processado');
  const nfeCancelados = agrupar(55, 'cancelado');
  const nfceProcessados = agrupar(65, 'processado');
  const nfceCancelados = agrupar(65, 'cancelado');

  const calcularTotais = (lista: NotaFiscal[]) => ({
    quantidade: lista.length,
    valor: Number(lista.reduce((acc, nota) => acc + nota.valorTotal, 0).toFixed(2))
  });

  const nfeProcTotais = calcularTotais(nfeProcessados);
  const nfeCancTotais = calcularTotais(nfeCancelados);
  const nfceProcTotais = calcularTotais(nfceProcessados);
  const nfceCancTotais = calcularTotais(nfceCancelados);

  const alertasMap = new Map<string, AlertaSequencia>();
  notasDoMes.forEach((nota) => {
    const key = `${nota.modelo}-${nota.serie}`;
    const existente = alertasMap.get(key) || { modelo: nota.modelo, serie: nota.serie, numerosFaltantes: [] };
    const numeros = existente.numerosFaltantes.concat([nota.numero]);
    alertasMap.set(key, { ...existente, numerosFaltantes: numeros });
  });

  const alertasSequencia: AlertaSequencia[] = Array.from(alertasMap.values()).map((entrada) => ({
    ...entrada,
    numerosFaltantes: calculateMissingNumbers(entrada.numerosFaltantes)
  }));

  return {
    mesSelecionado,
    nfe: {
      processados: nfeProcessados,
      cancelados: nfeCancelados,
      totalProcessados: nfeProcTotais.quantidade,
      valorProcessados: nfeProcTotais.valor,
      totalCancelados: nfeCancTotais.quantidade,
      valorCancelados: nfeCancTotais.valor
    },
    nfce: {
      processados: nfceProcessados,
      cancelados: nfceCancelados,
      totalProcessados: nfceProcTotais.quantidade,
      valorProcessados: nfceProcTotais.valor,
      totalCancelados: nfceCancTotais.quantidade,
      valorCancelados: nfceCancTotais.valor
    },
    alertasSequencia
  };
};

export const mesesDisponiveis = (notas: NotaFiscal[]): string[] => {
  const meses = Array.from(
    new Set(
      notas.map((nota) => {
        const month = `${nota.dataEmissao.getMonth() + 1}`.padStart(2, '0');
        const year = nota.dataEmissao.getFullYear();
        return `${month}/${year}`;
      })
    )
  );
  return meses.sort((a, b) => {
    const [ma, ya] = a.split('/').map(Number);
    const [mb, yb] = b.split('/').map(Number);
    if (ya === yb) return mb - ma;
    return yb - ya;
  });
};
