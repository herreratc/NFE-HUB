import { XMLParser } from 'fast-xml-parser';
import { NotaFiscal, StatusNota, XmlFileEntry } from '../types';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: true,
  trimValues: true
});

const extractData = (xmlContent: string): Omit<NotaFiscal, 'arquivo' | 'status'> | null => {
  const parsed = parser.parse(xmlContent);
  const infNFe = parsed?.nfeProc?.NFe?.infNFe || parsed?.NFe?.infNFe;
  if (!infNFe) {
    return null;
  }
  const ide = infNFe.ide;
  const total = infNFe.total?.ICMSTot;
  const chaveAcesso: string | undefined = infNFe.Id ? String(infNFe.Id).replace('NFe', '') : undefined;

  if (!ide || !total || !chaveAcesso) {
    return null;
  }

  const modelo = Number(ide.mod);
  const numero = Number(ide.nNF);
  const serie = Number(ide.serie);
  const dataEmissaoStr = ide.dhEmi || ide.dEmi;
  const valorTotal = Number(total.vNF);

  if (!dataEmissaoStr || Number.isNaN(modelo) || Number.isNaN(numero) || Number.isNaN(serie) || Number.isNaN(valorTotal)) {
    return null;
  }

  return {
    modelo: modelo === 55 ? 55 : 65,
    numero,
    serie,
    dataEmissao: new Date(dataEmissaoStr),
    valorTotal,
    chaveAcesso
  };
};

export const parseXmlFiles = async (files: XmlFileEntry[]): Promise<NotaFiscal[]> => {
  const notas: NotaFiscal[] = [];
  for (const file of files) {
    try {
      const contentResponse = await window.api.readFileContent(file.path);
      if (!contentResponse.success || !contentResponse.data) {
        throw new Error(contentResponse.message || 'Erro ao ler XML.');
      }
      const extracted = extractData(contentResponse.data);
      if (!extracted) {
        continue;
      }
      notas.push({
        ...extracted,
        arquivo: file.path,
        status: file.status as StatusNota
      });
    } catch (error) {
      console.error('Erro ao processar XML', file.path, error);
    }
  }
  return notas;
};
