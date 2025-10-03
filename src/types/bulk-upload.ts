export interface CSVProduct {
  sku: string;
  nombre: string;
  precio: string;
  precio_mayoreo?: string;
  descripcion?: string;
  categoria?: string;
}

export interface ImageFile {
  file: File;
  preview: string;
  cleanName: string;
}

export interface ProductMatch {
  image: ImageFile;
  csvData: CSVProduct | null;
  matchScore: number;
  matchType: 'exact' | 'contains' | 'fuzzy' | 'none';
  secondaryImages?: ImageFile[];
}

export interface UploadProgress {
  total: number;
  uploaded: number;
  failed: number;
  current: string;
  retrying?: boolean;
}
