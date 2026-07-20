import { Injectable, StreamableFile } from '@nestjs/common';
import { Workbook } from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportService {
  /**
   * Generates a CSV streamable file.
   */
  generateCsv(data: Record<string, any>[], filename: string, res: Response): StreamableFile {
    if (!data.length) {
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      });
      return new StreamableFile(Buffer.from(''));
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const stringVal = val === null || val === undefined ? '' : String(val);
        // Escape quotes and wrap in quotes if contains comma
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      });
      csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const buffer = Buffer.from(csvString);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Generates an Excel streamable file.
   */
  async generateExcel(data: Record<string, any>[], filename: string, res: Response): Promise<StreamableFile> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Report');

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      worksheet.columns = headers.map(header => ({
        header,
        key: header,
        width: 20,
      }));

      worksheet.addRows(data);
    }

    const buffer = await workbook.xlsx.writeBuffer();

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    });

    return new StreamableFile(Buffer.from(buffer));
  }
}
