import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listarXmls } from './services/fileSystem';
import { parseXmlFiles } from './services/xmlParser';
import { mesesDisponiveis, organizarDados } from './services/organizer';
import { DadosOrganizados, NotaFiscal } from './types';
import PeriodSelector from './components/PeriodSelector';
import Dashboard from './components/Dashboard';
import SequenceChecker from './components/SequenceChecker';
import DetailedTable from './components/DetailedTable';
import ExportButton from './components/ExportButton';
import { Loader2, FolderOpen, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [envPath, setEnvPath] = useState('C:/ATX/XPCONNECT/NFE/ENV');
  const [cancPath, setCancPath] = useState('C:/ATX/XPCONNECT/NFE/CANC');
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState('');
  const [dados, setDados] = useState<DadosOrganizados | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'empty'>('idle');
  const [erro, setErro] = useState('');
  const [toast, setToast] = useState<{ tipo: 'success' | 'error'; mensagem: string } | null>(null);

  const meses = useMemo(() => mesesDisponiveis(notas), [notas]);

  useEffect(() => {
    if (notas.length && !mesSelecionado) {
      setMesSelecionado(meses[0]);
    }
  }, [notas, mesSelecionado, meses]);

  useEffect(() => {
    if (mesSelecionado && notas.length) {
      setDados(organizarDados(notas, mesSelecionado));
      setStatus('success');
    }
  }, [mesSelecionado, notas]);

  const mostrarToast = useCallback((tipo: 'success' | 'error', mensagem: string) => {
    setToast({ tipo, mensagem });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const escolherDiretorio = useCallback(async (setter: (v: string) => void) => {
    const path = await window.api.selectDirectory();
    if (path) {
      setter(path);
    }
  }, []);

  const carregarXmls = useCallback(async () => {
    setStatus('loading');
    setErro('');
    try {
      const arquivos = await listarXmls(envPath, cancPath);
      if (!arquivos.length) {
        setNotas([]);
        setDados(null);
        setStatus('empty');
        return;
      }
      const notasProcessadas = await parseXmlFiles(arquivos);
      if (!notasProcessadas.length) {
        setStatus('empty');
        setNotas([]);
        setDados(null);
        return;
      }
      setNotas(notasProcessadas);
      const mesesOrdenados = mesesDisponiveis(notasProcessadas);
      setMesSelecionado(mesesOrdenados[0]);
      setStatus('success');
    } catch (error) {
      setErro((error as Error).message);
      setStatus('error');
    }
  }, [envPath, cancPath]);

  return (
    <div className="min-h-screen p-6 space-y-6" role="main">
      <header className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-3xl font-bold text-nfe-dark">NFeHub</h1>
          <p className="text-slate-600">Gerencie XMLs de NFe e NFCe com validações completas.</p>
        </div>
        <div className="flex items-center gap-2">
          {dados && <ExportButton dados={dados} onFeedback={mostrarToast} />}
        </div>
      </header>

      <section className="card grid md:grid-cols-2 gap-4" aria-label="Configuração de pastas">
        <div className="space-y-2">
          <label htmlFor="env" className="text-sm font-semibold text-slate-700">
            Pasta de Processados (ENV)
          </label>
          <div className="flex gap-2">
            <input
              id="env"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
              value={envPath}
              onChange={(e) => setEnvPath(e.target.value)}
            />
            <button
              type="button"
              className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200"
              onClick={() => escolherDiretorio(setEnvPath)}
              aria-label="Selecionar pasta ENV"
            >
              <FolderOpen className="w-5 h-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="canc" className="text-sm font-semibold text-slate-700">
            Pasta de Cancelados (CANC)
          </label>
          <div className="flex gap-2">
            <input
              id="canc"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2"
              value={cancPath}
              onChange={(e) => setCancPath(e.target.value)}
            />
            <button
              type="button"
              className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200"
              onClick={() => escolherDiretorio(setCancPath)}
              aria-label="Selecionar pasta CANC"
            >
              <FolderOpen className="w-5 h-5" aria-hidden />
            </button>
          </div>
        </div>
        <div className="md:col-span-2 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Caminhos padrão: C:/ATX/XPCONNECT/NFE/ENV e C:/ATX/XPCONNECT/NFE/CANC
          </p>
          <button
            type="button"
            onClick={carregarXmls}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-nfe-dark text-white font-semibold shadow-card"
          >
            {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <FolderOpen className="w-5 h-5" aria-hidden />} Carregar XMLs
          </button>
        </div>
      </section>

      {status === 'loading' && (
        <div className="card flex items-center gap-3 text-nfe-dark" role="status">
          <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
          <span>Carregando XMLs...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="card flex items-center gap-2 text-red-600" role="alert">
          <AlertTriangle className="w-5 h-5" aria-hidden />
          <span>{erro}</span>
        </div>
      )}

      {status === 'empty' && (
        <div className="card" role="alert">
          <p className="text-slate-700 font-semibold">Nenhum XML encontrado.</p>
          <p className="text-sm text-slate-600">Verifique as pastas selecionadas e tente novamente.</p>
        </div>
      )}

      {status === 'success' && dados && meses.length > 0 && (
        <>
          <PeriodSelector meses={meses} selecionado={mesSelecionado} onChange={setMesSelecionado} />
          <Dashboard dados={dados} />
          <SequenceChecker alertas={dados.alertasSequencia} />
          <DetailedTable dados={dados} />
        </>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-card text-white ${
            toast.tipo === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
          role="status"
        >
          {toast.mensagem}
        </div>
      )}
    </div>
  );
};

export default App;
