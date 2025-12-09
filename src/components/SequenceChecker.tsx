import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AlertaSequencia } from '../types';

interface SequenceCheckerProps {
  alertas: AlertaSequencia[];
}

const SequenceChecker: React.FC<SequenceCheckerProps> = React.memo(({ alertas }) => {
  const [expandido, setExpandido] = useState<{ [key: string]: boolean }>({ '55': true, '65': true });

  const agrupado = useMemo(() => {
    return alertas.reduce(
      (acc, alerta) => {
        const key = alerta.modelo === 55 ? '55' : '65';
        acc[key] = acc[key].concat(alerta);
        return acc;
      },
      { '55': [] as AlertaSequencia[], '65': [] as AlertaSequencia[] }
    );
  }, [alertas]);

  const renderLinha = (alerta: AlertaSequencia) => {
    const temFalhas = alerta.numerosFaltantes.length > 0;
    const Icone = temFalhas ? AlertTriangle : CheckCircle2;
    const cor = temFalhas ? 'text-amber-500' : 'text-emerald-600';
    const descricao = temFalhas
      ? `Números faltantes: ${alerta.numerosFaltantes.join(', ')}`
      : 'Sequência completa';
    return (
      <div
        key={`${alerta.modelo}-${alerta.serie}`}
        className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-white"
        role="listitem"
      >
        <Icone className={`w-5 h-5 mt-0.5 ${cor}`} aria-hidden />
        <div>
          <p className="font-semibold text-slate-800">Série {alerta.serie}</p>
          <p className="text-sm text-slate-600">{descricao}</p>
        </div>
      </div>
    );
  };

  const renderGrupo = (modelo: '55' | '65', titulo: string) => (
    <div className="card space-y-3" role="region" aria-label={`Alertas ${titulo}`}>
      <button
        type="button"
        className="flex items-center gap-2 text-left w-full"
        onClick={() => setExpandido((prev) => ({ ...prev, [modelo]: !prev[modelo] }))}
        aria-expanded={expandido[modelo]}
      >
        {expandido[modelo] ? <ChevronDown className="w-5 h-5" aria-hidden /> : <ChevronRight className="w-5 h-5" aria-hidden />}<span className="font-semibold text-slate-800">{titulo}</span>
      </button>
      {expandido[modelo] && (
        <div className="grid gap-2" role="list">
          {agrupado[modelo].length ? agrupado[modelo].map((alerta) => renderLinha(alerta)) : (
            <p className="text-sm text-slate-500">Nenhuma série encontrada.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-4" aria-label="Validação de sequência">
      {renderGrupo('55', 'NFe - Modelo 55')}
      {renderGrupo('65', 'NFCe - Modelo 65')}
    </div>
  );
});

export default SequenceChecker;
