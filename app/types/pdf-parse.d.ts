declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }

  interface PDFOptions {
    max?: number;
    version?: string;
    pagerender?: (pageData: { pageIndex: number; pageContent: string }) => string;
  }

  function parse(buffer: Buffer | ArrayBuffer, options?: PDFOptions): Promise<PDFData>;
  
  export = parse;
} 