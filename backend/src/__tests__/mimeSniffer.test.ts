import { sniffMimeType } from '../utils/mimeSniffer';

describe('mimeSniffer utility', () => {
  it('should correctly sniff PDF buffers and allow them', () => {
    const pdfBuffer = Buffer.from('25504446', 'hex'); // %PDF
    const result = sniffMimeType(pdfBuffer, 'document.pdf');
    expect(result.mimeType).toBe('application/pdf');
    expect(result.isAllowed).toBe(true);
  });

  it('should correctly sniff PNG buffers and allow them', () => {
    const pngBuffer = Buffer.from('89504e470d0a1a0a', 'hex');
    const result = sniffMimeType(pngBuffer, 'image.png');
    expect(result.mimeType).toBe('image/png');
    expect(result.isAllowed).toBe(true);
  });

  it('should correctly sniff JPEG buffers and allow them', () => {
    const jpegBuffer = Buffer.from('ffd8ffe000104a464946', 'hex');
    const result = sniffMimeType(jpegBuffer, 'photo.jpg');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.isAllowed).toBe(true);
  });

  it('should correctly sniff ZIP/Office buffers based on extension', () => {
    const zipHeader = Buffer.from('504b0304', 'hex'); // PK..
    
    const zipResult = sniffMimeType(zipHeader, 'archive.zip');
    expect(zipResult.mimeType).toBe('application/zip');
    expect(zipResult.isAllowed).toBe(true);

    const docxResult = sniffMimeType(zipHeader, 'report.docx');
    expect(docxResult.mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(docxResult.isAllowed).toBe(true);

    const xlsxResult = sniffMimeType(zipHeader, 'data.xlsx');
    expect(xlsxResult.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(xlsxResult.isAllowed).toBe(true);
  });

  it('should sniff plain text and CSV files without null bytes', () => {
    const txtBuffer = Buffer.from('Hello world! This is plain text.', 'utf-8');
    const resultTxt = sniffMimeType(txtBuffer, 'readme.txt');
    expect(resultTxt.mimeType).toBe('text/plain');
    expect(resultTxt.isAllowed).toBe(true);

    const csvBuffer = Buffer.from('id,name,value\n1,Test,100', 'utf-8');
    const resultCsv = sniffMimeType(csvBuffer, 'export.csv');
    expect(resultCsv.mimeType).toBe('text/csv');
    expect(resultCsv.isAllowed).toBe(true);
  });

  it('should reject text or CSV extensions if null bytes are present to block executable spoofing', () => {
    const maliciousBuffer = Buffer.from('MZ\0\0Hello World\0', 'utf-8');
    const result = sniffMimeType(maliciousBuffer, 'safe.txt');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(result.isAllowed).toBe(false);
  });

  it('should reject unrecognised/executable magic numbers', () => {
    const exeBuffer = Buffer.from('4d5a900003000000', 'hex'); // MZ PE header
    const result = sniffMimeType(exeBuffer, 'malicious.exe');
    expect(result.mimeType).toBe('application/octet-stream');
    expect(result.isAllowed).toBe(false);
  });
});
