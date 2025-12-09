import React, { useMemo } from 'react';

interface PeriodSelectorProps {
  meses: string[];
  selecionado: string;
  onChange: (mes: string) => void;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = React.memo(({ meses, selecionado, onChange }) => {
  const mesAnterior = useMemo(() => {
    const agora = new Date();
    agora.setMonth(agora.getMonth() - 1);
    const month = `${agora.getMonth() + 1}`.padStart(2, '0');
    const year = agora.getFullYear();
    return `${month}/${year}`;
  }, []);

  return (
    <div className="card flex flex-col gap-2" aria-label="Selecione o período">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Período</p>
          <h2 className="text-lg font-semibold">Selecione o mês de referência</h2>
        </div>
        <span className="badge bg-slate-100 text-slate-700" aria-live="polite">
          Destaque: {mesAnterior}
        </span>
      </div>
      <select
        value={selecionado}
        onChange={(e) => onChange(e.target.value)}
        className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-nfe-dark"
        aria-label="Mês selecionado"
      >
        {meses.map((mes) => (
          <option key={mes} value={mes} aria-label={`Selecionar mês ${mes}`}>
            {mes}
          </option>
        ))}
      </select>
    </div>
  );
});

export default PeriodSelector;
