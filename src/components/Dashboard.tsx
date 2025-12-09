import React from 'react';
import { CheckCircle2, XCircle, Wallet, Scale } from 'lucide-react';
import { DadosOrganizados } from '../types';

interface DashboardProps {
  dados: DadosOrganizados;
}

const Card: React.FC<{ title: string; quantidade: number; valor: number; colorClass: string; icon: React.ReactNode }>
 = React.memo(({ title, quantidade, valor, colorClass, icon }) => (
  <div className="card flex flex-col gap-2" role="article" aria-label={title}>
    <div className="flex items-center gap-2 text-sm text-slate-500">
      {icon}
      <span>{title}</span>
    </div>
    <div className="flex items-center justify-between">
      <p className={`text-3xl font-bold ${colorClass}`}>{quantidade}</p>
      <p className="text-sm text-slate-500">{valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
    </div>
  </div>
));

const SecaoDashboard: React.FC<{ titulo: string; cor: 'nfe' | 'nfce'; processados: { quantidade: number; valor: number }; cancelados: { quantidade: number; valor: number } }>
 = React.memo(({ titulo, cor, processados, cancelados }) => {
  const total = processados.valor + cancelados.valor;
  const liquido = processados.valor - cancelados.valor;
  const colorMap = {
    nfe: 'text-nfe-dark',
    nfce: 'text-nfce-dark'
  };
  return (
    <div className="space-y-3" aria-label={`Resumo ${titulo}`}>
      <h3 className={`text-xl font-semibold ${colorMap[cor]}`}>{titulo}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          title="Processados"
          quantidade={processados.quantidade}
          valor={processados.valor}
          colorClass={colorMap[cor]}
          icon={<CheckCircle2 className={`w-5 h-5 ${colorMap[cor]}`} aria-hidden />}
        />
        <Card
          title="Cancelados"
          quantidade={cancelados.quantidade}
          valor={cancelados.valor}
          colorClass="text-red-600"
          icon={<XCircle className="w-5 h-5 text-red-600" aria-hidden />}
        />
        <Card
          title="Total Geral"
          quantidade={processados.quantidade + cancelados.quantidade}
          valor={total}
          colorClass="text-slate-700"
          icon={<Scale className="w-5 h-5 text-slate-600" aria-hidden />}
        />
        <Card
          title="Valor Líquido"
          quantidade={processados.quantidade}
          valor={liquido}
          colorClass={colorMap[cor]}
          icon={<Wallet className={`w-5 h-5 ${colorMap[cor]}`} aria-hidden />}
        />
      </div>
    </div>
  );
});

const Dashboard: React.FC<DashboardProps> = React.memo(({ dados }) => (
  <div className="grid gap-6" aria-label="Dashboard de indicadores">
    <SecaoDashboard
      titulo="NFe"
      cor="nfe"
      processados={{ quantidade: dados.nfe.totalProcessados, valor: dados.nfe.valorProcessados }}
      cancelados={{ quantidade: dados.nfe.totalCancelados, valor: dados.nfe.valorCancelados }}
    />
    <SecaoDashboard
      titulo="NFCe"
      cor="nfce"
      processados={{ quantidade: dados.nfce.totalProcessados, valor: dados.nfce.valorProcessados }}
      cancelados={{ quantidade: dados.nfce.totalCancelados, valor: dados.nfce.valorCancelados }}
    />
  </div>
));

export default Dashboard;
