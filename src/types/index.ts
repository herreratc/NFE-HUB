export type StatusNota = 'processado' | 'cancelado';

export interface NotaFiscal {
  modelo: 55 | 65;
  numero: number;
  serie: number;
  dataEmissao: Date;
  valorTotal: number;
  chaveAcesso: string;
  arquivo: string;
  status: StatusNota;
}

export interface AlertaSequencia {
  modelo: 55 | 65;
  serie: number;
  numerosFaltantes: number[];
}

export interface DadosOrganizados {
  mesSelecionado: string;
  nfe: {
    processados: NotaFiscal[];
    cancelados: NotaFiscal[];
    totalProcessados: number;
    valorProcessados: number;
    totalCancelados: number;
    valorCancelados: number;
  };
  nfce: {
    processados: NotaFiscal[];
    cancelados: NotaFiscal[];
    totalProcessados: number;
    valorProcessados: number;
    totalCancelados: number;
    valorCancelados: number;
  };
  alertasSequencia: AlertaSequencia[];
}

export interface XmlFileEntry {
  name: string;
  path: string;
  status: StatusNota;
}

export interface ExportItem {
  source: string;
  relativePath: string;
}

export interface ExportPayload {
  baseName: string;
  reportContent: string;
  items: ExportItem[];
}

declare global {
  interface Window {
    api: {
      selectDirectory: () => Promise<string | null>;
      listXmlFiles: (paths: { envPath: string; cancPath: string }) => Promise<{ success: boolean; files?: XmlFileEntry[]; message?: string }>;
      readFileContent: (filePath: string) => Promise<{ success: boolean; data?: string; message?: string }>;
      prepareExport: (payload: ExportPayload) => Promise<{ success: boolean; zipPath?: string; message?: string }>;
    };
  }
}
