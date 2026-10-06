import ExcelJS from "exceljs";
import type { Cell, CellFormat, Sheet } from "@/lib/overview-export";

// Server only (exceljs): writes the sheets built by lib/overview-export.ts.

const NUM_FMT: Partial<Record<CellFormat, string>> = {
  int: "0",
  dec: "0.0",
  pct: "0%",
  date: "dd/mm/yyyy",
};

function toValue(value: Cell, format: CellFormat): ExcelJS.CellValue {
  if (value == null) return null;
  if (format === "date" && typeof value === "string") {
    const [y, m, d] = value.slice(0, 10).split("-").map(Number);
    // exceljs converts dates as UTC: keeps the calendar day of "YYYY-MM-DD".
    return new Date(Date.UTC(y, m - 1, d));
  }
  return value;
}

export async function buildWorkbook(sheets: readonly Sheet[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ultimate Basketball";
  workbook.created = new Date();

  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name, { views: [{ state: "frozen", ySplit: 1 }] });
    ws.columns = sheet.columns.map((c) => ({ header: c.header, width: c.width }));

    const header = ws.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1A1A1A" } };
    header.alignment = { vertical: "middle" };

    for (const row of sheet.rows) {
      const formats = sheet.columns.map((c, i) => row.formats?.[i] ?? c.format);
      const added = ws.addRow(row.cells.map((v, i) => toValue(v, formats[i])));
      formats.forEach((format, i) => {
        const fmt = NUM_FMT[format];
        if (fmt) added.getCell(i + 1).numFmt = fmt;
      });
      if (row.total) {
        added.font = { bold: true };
        added.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } };
      }
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
