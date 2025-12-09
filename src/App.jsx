import { useState } from 'react';

const defaultRoot = 'C:/ATX/XPCONNECT';

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function StatusBadge({ status }) {
  const label = status === 'cancelado' ? 'Cancelado' : 'Processado';
  const color = status === 'cancelado' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{label}</span>;
}

export default function App() {
  const [rootPath, setRootPath] = useState(defaultRoot);
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState('Aguardando ação');
  const [totals, setTotals] = useState({ processados: 0, cancelados: 0, somaValores: 0 });
  const [errors, setErrors] = useState([]);

  const hasElectron = typeof window !== 'undefined' && window.api;

  const handleSelectRoot = async () => {
    if (!hasElectron) return;
    const selected = await window.api.selectRoot();
    if (selected) {
      setRootPath(selected);
    }
  };

  const handleScan = async () => {
    if (!hasElectron) return;
    if (!rootPath) {
      setStatus('Selecione uma pasta antes de escanear.');
      return;
    }

    setStatus('Escaneando arquivos XML...');
    setNotes([]);
    setErrors([]);

    try {
      const result = await window.api.scanXml(rootPath);
      setNotes(result.notes || []);
      setTotals(result.totals || { processados: 0, cancelados: 0, somaValores: 0 });
      setErrors(result.errors || []);
      setStatus('Escaneamento concluído');
    } catch (error) {
      setStatus(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Leitor XML NFe/NFCe</h1>
            <p className="text-sm text-slate-500">Varre as pastas ENV e CANC para montar um resumo das notas.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSelectRoot}
              className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 transition"
            >
              Selecionar pasta raiz
            </button>
            <button
              onClick={handleScan}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition"
            >
              Escanear XML
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        <div className="bg-white rounded shadow p-4 space-y-2">
          <h2 className="text-lg font-semibold">Pasta selecionada</h2>
          <p className="text-sm text-slate-600">{rootPath || 'Nenhuma pasta selecionada'}</p>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">{status}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-slate-500">Notas processadas</p>
            <p className="text-2xl font-semibold">{totals.processados}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-slate-500">Notas canceladas</p>
            <p className="text-2xl font-semibold">{totals.cancelados}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-slate-500">Soma dos valores</p>
            <p className="text-2xl font-semibold">{formatCurrency(totals.somaValores || 0)}</p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="bg-white rounded shadow p-4">
            <h3 className="text-lg font-semibold mb-2">Arquivos com erro</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((err, index) => (
                <li key={index}>{err.file}: {err.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Notas encontradas ({notes.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-4 py-2">Número</th>
                  <th className="px-4 py-2">Série</th>
                  <th className="px-4 py-2">Modelo</th>
                  <th className="px-4 py-2">Data</th>
                  <th className="px-4 py-2">Valor</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {notes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-slate-500 px-4 py-4">Nenhuma nota encontrada.</td>
                  </tr>
                )}
                {notes.map((note, index) => (
                  <tr key={`${note.numero}-${index}`} className="odd:bg-white even:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{note.numero}</td>
                    <td className="px-4 py-2">{note.serie}</td>
                    <td className="px-4 py-2">{note.modelo}</td>
                    <td className="px-4 py-2">{note.data}</td>
                    <td className="px-4 py-2">{formatCurrency(Number(note.valor) || 0)}</td>
                    <td className="px-4 py-2"><StatusBadge status={note.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
