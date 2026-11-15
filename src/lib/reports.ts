import "server-only";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import ExcelJS from "exceljs";
import { todayISO } from "./dates";
import { daysPhrase, formatDate, formatLongDate } from "./format";
import { alertLabel } from "./labels";
import { locName, type Locale } from "./text";
import type { AlertRow } from "./view";

function headers(locale: Locale) {
  return locale === "ar"
    ? ["العملية", "الإدارة", "المرحلة", "التنبيه", "بدء مخطط", "نهو مخطط", "أيام التأخير", "الموافقة الفنية"]
    : ["Operation", "Department", "Stage", "Alert", "Planned start", "Planned due", "Days late", "Technical approval"];
}

function cells(row: AlertRow, locale: Locale) {
  return [
    locName(locale, row.operationAr, row.operationEn),
    locName(locale, row.departmentAr, row.departmentEn),
    locName(locale, row.stageAr, row.stageEn),
    alertLabel(locale, row.type),
    formatDate(row.plannedStart),
    formatDate(row.plannedDue),
    String(row.daysLate),
    formatDate(row.approvalDate),
  ];
}

export async function buildAlertsWorkbook(rows: AlertRow[], locale: Locale) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Operio";
  const sheet = workbook.addWorksheet(locale === "ar" ? "التنبيهات" : "Alerts", {
    views: [{ rightToLeft: locale === "ar", state: "frozen", ySplit: 3 }],
  });
  sheet.mergeCells("A1:H1");
  const title = sheet.getCell("A1");
  title.value = locale === "ar" ? "قطاع الري — تنبيهات تجاوز المدة" : "Irrigation Sector — overdue alerts";
  title.font = { bold: true, size: 16, color: { argb: "FF0B6A9A" }, name: "Arial" };
  sheet.getCell("A2").value = `${formatLongDate(todayISO(), locale)} · ${rows.length}`;
  const header = sheet.addRow(headers(locale));
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B6A9A" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial" };
    cell.alignment = { horizontal: locale === "ar" ? "right" : "left" };
  });
  for (const row of rows) {
    const added = sheet.addRow(cells(row, locale));
    added.eachCell((cell) => {
      cell.alignment = { horizontal: locale === "ar" ? "right" : "left", wrapText: true };
      cell.font = { name: "Arial", size: 12 };
    });
  }
  sheet.columns.forEach((column) => {
    column.width = 32;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function paragraph(text: string, locale: Locale, bold = false) {
  const arabic = locale === "ar";
  return new Paragraph({
    bidirectional: arabic,
    alignment: arabic ? AlignmentType.RIGHT : AlignmentType.LEFT,
    children: [new TextRun({ text, bold, font: "Arial", rightToLeft: arabic, size: bold ? 28 : 22 })],
  });
}

function wordCell(text: string, locale: Locale, header = false) {
  const arabic = locale === "ar";
  return new TableCell({
    width: { size: 12, type: WidthType.PERCENTAGE },
    shading: header ? { fill: "0B6A9A" } : undefined,
    children: [
      new Paragraph({
        bidirectional: arabic,
        alignment: arabic ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: header, font: "Arial", rightToLeft: arabic, size: 16, color: header ? "FFFFFF" : "122833" })],
      }),
    ],
  });
}

export async function buildAlertsDocument(rows: AlertRow[], locale: Locale) {
  const title = locale === "ar" ? "تقرير تنبيهات تجاوز المدة — قطاع الري" : "Overdue alert report — Irrigation Sector";
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers(locale).map((item) => wordCell(item, locale, true)), tableHeader: true }),
      ...(rows.length
        ? rows.map((row) => new TableRow({ children: cells(row, locale).map((item) => wordCell(item, locale)) }))
        : [new TableRow({ children: [wordCell(locale === "ar" ? "لا تنبيهات" : "No alerts", locale)] })]),
    ],
  });
  const details = rows.flatMap((row, index) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      bidirectional: locale === "ar",
      alignment: locale === "ar" ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text: `${index + 1}. ${locName(locale, row.operationAr, row.operationEn)}`, bold: true, font: "Arial", rightToLeft: locale === "ar" })],
    }),
    paragraph(locale === "ar"
      ? `الإدارة: ${row.departmentAr} — المرحلة: ${row.stageAr} — التنبيه: ${alertLabel(locale, row.type)}`
      : `Department: ${row.departmentEn} — Stage: ${row.stageEn} — Alert: ${alertLabel(locale, row.type)}`, locale),
    paragraph(locale === "ar"
      ? `المخطط من ${formatDate(row.plannedStart)} إلى ${formatDate(row.plannedDue)}. التأخير ${daysPhrase(locale, row.daysLate)}. الموافقة الفنية ${formatDate(row.approvalDate)}.`
      : `Plan ${formatDate(row.plannedStart)} to ${formatDate(row.plannedDue)}. Delay ${daysPhrase(locale, row.daysLate)}. Technical approval ${formatDate(row.approvalDate)}.`, locale),
  ]);
  const document = new Document({
    sections: [{
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          bidirectional: locale === "ar",
          alignment: locale === "ar" ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [new TextRun({ text: title, bold: true, font: "Arial", rightToLeft: locale === "ar" })],
        }),
        paragraph(locale === "ar" ? "وزارة الموارد المائية والري" : "Ministry of Water Resources and Irrigation", locale),
        paragraph(`${formatLongDate(todayISO(), locale)} · ${rows.length}`, locale),
        table,
        ...details,
      ],
    }],
  });
  return Packer.toBuffer(document);
}
