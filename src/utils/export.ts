import { DadosOrganizados, ExportItem, NotaFiscal } from '../types';
import { format } from 'date-fns';

const formatCurrency = (valor: number): string =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const coletarSeries = (notas: NotaFiscal[]): number[] => Array.from(new Set(notas.map((n) => n.serie))).sort((a, b) => a - b);

export const gerarRelatorio = (dados: DadosOrganizados): string => {
  const linhas: string[] = [];
  linhas.push('=== RELATÓRIO DE ENVIO DE XMLs ===');
  linhas.push(`Período: ${dados.mesSelecionado}`);
  linhas.push(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`);
  linhas.push('--- NFe (Modelo 55) ---');
  linhas.push(
    `Processadas: ${dados.nfe.totalProcessados} notas - ${formatCurrency(dados.nfe.valorProcessados)}`
  );
  linhas.push(
    `Canceladas: ${dados.nfe.totalCancelados} notas - ${formatCurrency(dados.nfe.valorCancelados)}`
  );
  linhas.push(
    `Valor Líquido: ${formatCurrency(dados.nfe.valorProcessados - dados.nfe.valorCancelados)}`
  );
  linhas.push('--- NFCe (Modelo 65) ---');
  linhas.push(
    `Processadas: ${dados.nfce.totalProcessados} notas - ${formatCurrency(dados.nfce.valorProcessados)}`
  );
  linhas.push(
    `Canceladas: ${dados.nfce.totalCancelados} notas - ${formatCurrency(dados.nfce.valorCancelados)}`
  );
  linhas.push(
    `Valor Líquido: ${formatCurrency(dados.nfce.valorProcessados - dados.nfce.valorCancelados)}`
  );
  const seriesNfe = coletarSeries([...dados.nfe.processados, ...dados.nfe.cancelados]);
  const seriesNfce = coletarSeries([...dados.nfce.processados, ...dados.nfce.cancelados]);
  linhas.push('--- Séries Identificadas ---');
  linhas.push(`NFe: ${seriesNfe.length ? seriesNfe.map((s) => `Série ${s}`).join(', ') : 'Nenhuma'}`);
  linhas.push(`NFCe: ${seriesNfce.length ? seriesNfce.map((s) => `Série ${s}`).join(', ') : 'Nenhuma'}`);
  linhas.push('--- Alertas de Sequência ---');
  dados.alertasSequencia.forEach((alerta) => {
    const prefixo = alerta.numerosFaltantes.length ? '⚠️' : '✓';
    const modeloNome = alerta.modelo === 55 ? 'NFe' : 'NFCe';
    const mensagem = alerta.numerosFaltantes.length
      ? `${prefixo} ${modeloNome} Série ${alerta.serie}: Números faltantes: ${alerta.numerosFaltantes.join(', ')}`
      : `${prefixo} ${modeloNome} Série ${alerta.serie}: Sequência completa`;
    linhas.push(mensagem);
  });
  return linhas.join('\n');
};

export const montarItensExportacao = (dados: DadosOrganizados): ExportItem[] => {
  const itens: ExportItem[] = [];
  const adicionar = (lista: NotaFiscal[], pasta: string) => {
    lista.forEach((nota) => {
      itens.push({ source: nota.arquivo, relativePath: `${pasta}/${nota.arquivo.split(/[\\/]/).pop()}` });
    });
  };

  adicionar(dados.nfe.processados, 'NFe/Processados');
  adicionar(dados.nfe.cancelados, 'NFe/Cancelados');
  adicionar(dados.nfce.processados, 'NFCe/Processados');
  adicionar(dados.nfce.cancelados, 'NFCe/Cancelados');

  return itens;
};
