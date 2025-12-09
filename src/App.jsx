import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';

const defaultRoot = 'C:/ATX/XPCONNECT';

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatDate(value) {
  try {
    return format(parseISO(value), 'dd/MM/yyyy');
  } catch (error) {
    const fallback = new Date(value);
    if (!isNaN(fallback)) {
      return format(fallback, 'dd/MM/yyyy');
    }
  }
  return value || '';
}

function parseNoteDate(value) {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch (error) {
    const fallback = new Date(value);
    return isNaN(fallback) ? null : fallback;
  }
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
  const [errors, setErrors] = useState([]);
  const today = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

  const hasElectron = typeof window !== 'undefined' && window.api;

  const yearsAvailable = useMemo(() => {
    const years = new Set([today.getFullYear()]);
    notes.forEach((note) => {
      const parsed = parseNoteDate(note.data);
      if (parsed) years.add(parsed.getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [notes, today]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const parsedDate = parseNoteDate(note.data);
      if (!parsedDate) return true;
      return (
        parsedDate.getFullYear() === Number(selectedYear) &&
        parsedDate.getMonth() + 1 === Number(selectedMonth)
      );
    });
  }, [notes, selectedMonth, selectedYear]);

  const filteredTotals = useMemo(() => {
    const processados = filteredNotes.filter((n) => n.status === 'processado').length;
    const cancelados = filteredNotes.filter((n) => n.status === 'cancelado').length;
    const somaValores = filteredNotes.reduce((acc, n) => acc + (Number(n.valor) || 0), 0);
    return { processados, cancelados, somaValores };
  }, [filteredNotes]);

  const handleSelectRoot = async () => {
    if (!hasElectron) {
      setStatus('A seleção de pasta está disponível apenas no aplicativo desktop.');
      return;
    }
    const selected = await window.api.selectRoot();
    if (selected) {
      setRootPath(selected);
    }
  };

  const handleScan = async () => {
    if (!hasElectron) {
      setStatus('O escaneamento de XML está disponível apenas no aplicativo desktop.');
      return;
    }
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
            <p className="text-2xl font-semibold">{filteredTotals.processados}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-slate-500">Notas canceladas</p>
            <p className="text-2xl font-semibold">{filteredTotals.cancelados}</p>
          </div>
          <div className="bg-white rounded shadow p-4">
            <p className="text-sm text-slate-500">Soma dos valores</p>
            <p className="text-2xl font-semibold">{formatCurrency(filteredTotals.somaValores || 0)}</p>
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
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <div>
                <label className="block text-slate-500 mb-1">Mês</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="border border-slate-200 rounded px-3 py-2"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                    <option key={month} value={month}>{month.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Ano</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="border border-slate-200 rounded px-3 py-2"
                >
                  {yearsAvailable.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="self-end text-slate-600">
                <p>Notas exibidas: {filteredNotes.length}</p>
              </div>
            </div>
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
                {filteredNotes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-slate-500 px-4 py-4">Nenhuma nota encontrada.</td>
                  </tr>
                )}
                {filteredNotes.map((note, index) => (
                  <tr key={`${note.numero}-${index}`} className="odd:bg-white even:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{note.numero}</td>
                    <td className="px-4 py-2">{note.serie}</td>
                    <td className="px-4 py-2">{note.modelo}</td>
                    <td className="px-4 py-2">{formatDate(note.data)}</td>
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
