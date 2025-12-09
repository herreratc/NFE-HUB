import React, { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { DadosOrganizados } from '../types';
import { gerarRelatorio, montarItensExportacao } from '../utils/export';

interface ExportButtonProps {
  dados: DadosOrganizados;
  onFeedback: (tipo: 'success' | 'error', mensagem: string) => void;
}

const ExportButton: React.FC<ExportButtonProps> = React.memo(({ dados, onFeedback }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const baseName = `Exportacao_${dados.mesSelecionado.replace('/', '_')}`;
      const itens = montarItensExportacao(dados);
      const payload = {
        baseName,
        reportContent: gerarRelatorio(dados),
        items: itens
      };
      const result = await window.api.prepareExport(payload);
      if (!result.success || !result.zipPath) {
        throw new Error(result.message || 'Não foi possível gerar o ZIP.');
      }
      onFeedback('success', `Pacote gerado com sucesso em ${result.zipPath}`);
    } catch (error) {
      onFeedback('error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-nfce-dark text-white font-semibold shadow-card disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden /> : <Send className="w-5 h-5" aria-hidden />} Preparar para Envio
    </button>
  );
});

export default ExportButton;
