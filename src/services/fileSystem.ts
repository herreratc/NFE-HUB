import { XmlFileEntry } from '../types';

export const listarXmls = async (envPath: string, cancPath: string): Promise<XmlFileEntry[]> => {
  try {
    const response = await window.api.listXmlFiles({ envPath, cancPath });
    if (!response.success || !response.files) {
      throw new Error(response.message || 'Não foi possível listar os XMLs.');
    }
    return response.files;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
