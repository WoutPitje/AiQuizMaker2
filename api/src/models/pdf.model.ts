export interface PdfPage {
  pageNumber: number;
  imagePath: string;
  textContent: string;
}

export interface PdfProcessingResult {
  totalPages: number;
  pages: PdfPage[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}
