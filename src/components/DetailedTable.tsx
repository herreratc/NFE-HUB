import React, { useMemo, useState } from 'react';
import { DadosOrganizados, NotaFiscal } from '../types';
import { format } from 'date-fns';

interface DetailedTableProps {
  dados: DadosOrganizados;
}

type TabKey = 'nfeProc' | 'nfeCanc' | 'nfceProc' | 'nfceCanc';

const tabConfig: Record<TabKey, { titulo: string; lista: (dados: DadosOrganizados) => NotaFiscal[] }> = {
  nfeProc: { titulo: 'NFe Processados', lista: (dados) => dados.nfe.processados },
  nfeCanc: { titulo: 'NFe Cancelados', lista: (dados) => dados.nfe.cancelados },
  nfceProc: { titulo: 'NFCe Processados', lista: (dados) => dados.nfce.processados },
  nfceCanc: { titulo: 'NFCe Cancelados', lista: (dados) => dados.nfce.cancelados }
};

const colClasses = 'px-3 py-2 text-sm';

const DetailedTable: React.FC<DetailedTableProps> = React.memo(({ dados }) => {
  const [tab, setTab] = useState<TabKey>('nfeProc');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<{ coluna: keyof NotaFiscal; direcao: 'asc' | 'desc' }>({ coluna: 'numero', direcao: 'asc' });
  const [pagina, setPagina] = useState(1);

  const dadosFiltrados = useMemo(() => {
    const base = tabConfig[tab].lista(dados);
    const texto = busca.toLowerCase();
    return base.filter((nota) => {
      const nomeArquivo = nota.arquivo.split(/[/\\]/).pop() || '';
      return (
        nomeArquivo.toLowerCase().includes(texto) ||
        `${nota.numero}`.includes(texto) ||
        `${nota.serie}`.includes(texto) ||
        nota.chaveAcesso.toLowerCase().includes(texto)
      );
    });
  }, [dados, tab, busca]);

  const dadosOrdenados = useMemo(() => {
    const copia = [...dadosFiltrados];
    copia.sort((a, b) => {
      const { coluna, direcao } = ordenacao;
      const mult = direcao === 'asc' ? 1 : -1;
      if (coluna === 'dataEmissao') {
        return (a.dataEmissao.getTime() - b.dataEmissao.getTime()) * mult;
      }
      const valorA = (a[coluna] as number | string) ?? '';
      const valorB = (b[coluna] as number | string) ?? '';
      if (valorA < valorB) return -1 * mult;
      if (valorA > valorB) return 1 * mult;
      return 0;
    });
    return copia;
  }, [dadosFiltrados, ordenacao]);

  const itensPorPagina = 50;
  const totalPaginas = Math.max(1, Math.ceil(dadosOrdenados.length / itensPorPagina));
  const paginaCorrigida = Math.min(pagina, totalPaginas);
  const inicio = (paginaCorrigida - 1) * itensPorPagina;
  const paginaAtual = dadosOrdenados.slice(inicio, inicio + itensPorPagina);

  const alterarOrdenacao = (coluna: keyof NotaFiscal) => {
    setPagina(1);
    setOrdenacao((prev) =>
      prev.coluna === coluna ? { coluna, direcao: prev.direcao === 'asc' ? 'desc' : 'asc' } : { coluna, direcao: 'asc' }
    );
  };

  return (
    <div className="card" aria-label="Tabela detalhada">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {Object.entries(tabConfig).map(([key, value]) => (
          <button
            key={key}
            type="button"
            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${tab === key ? 'bg-nfe-light text-nfe-dark border-nfe-dark' : 'bg-white border-slate-200 text-slate-700'}`}
            onClick={() => {
              setTab(key as TabKey);
              setPagina(1);
            }}
            aria-pressed={tab === key}
          >
            {value.titulo}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="busca" className="text-sm text-slate-600">
            Busca rápida
          </label>
          <input
            id="busca"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPagina(1);
            }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Número, série, arquivo"
          />
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full" role="table">
          <thead className="bg-slate-100">
            <tr>
              {['numero', 'serie', 'dataEmissao', 'valorTotal', 'arquivo'].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className={`table-header px-3 py-2 cursor-pointer select-none ${ordenacao.coluna === col ? 'text-nfe-dark' : ''}`}
                  onClick={() => alterarOrdenacao(col as keyof NotaFiscal)}
                >
                  {col === 'numero' && 'Número'}
                  {col === 'serie' && 'Série'}
                  {col === 'dataEmissao' && 'Data'}
                  {col === 'valorTotal' && 'Valor'}
                  {col === 'arquivo' && 'Arquivo'}
                  {ordenacao.coluna === col ? (ordenacao.direcao === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginaAtual.map((nota) => {
              const nomeArquivo = nota.arquivo.split(/[/\\]/).pop();
              return (
                <tr key={`${nota.modelo}-${nota.serie}-${nota.numero}-${nota.arquivo}`} className="odd:bg-white even:bg-slate-50">
                  <td className={colClasses}>{nota.numero}</td>
                  <td className={colClasses}>{nota.serie}</td>
                  <td className={colClasses}>{format(nota.dataEmissao, 'dd/MM/yyyy')}</td>
                  <td className={colClasses}>
                    {nota.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className={`${colClasses} truncate max-w-xs`} title={nota.arquivo}>
                    {nomeArquivo}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-slate-600">
        <span>
          Página {paginaCorrigida} de {totalPaginas} — {dadosOrdenados.length} registros
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaCorrigida === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="px-3 py-1 border border-slate-200 rounded disabled:opacity-50"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaCorrigida === totalPaginas}
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
});

export default DetailedTable;
