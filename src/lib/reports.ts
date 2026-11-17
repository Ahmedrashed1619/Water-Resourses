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
import { alertLabel, statusLabel } from "./labels";
import { addMoney } from "./money";
import { locName, type Locale } from "./text";
import type { OperationExportRow } from "./queries";
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

function styleHeader(row: ExcelJS.Row, locale: Locale) {
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B6A9A" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial" };
    cell.alignment = { horizontal: locale === "ar" ? "right" : "left", wrapText: true };
  });
}

export async function buildOperationsWorkbook(rows: OperationExportRow[], locale: Locale, title?: string) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Operio";
  const arabic = locale === "ar";
  const summary = workbook.addWorksheet(arabic ? "ملخص" : "Summary", {
    views: [{ rightToLeft: arabic, state: "frozen", ySplit: 3 }],
  });
  const details = workbook.addWorksheet(arabic ? "التفاصيل" : "Details", {
    views: [{ rightToLeft: arabic, state: "frozen", ySplit: 3 }],
  });

  const heading = title ?? (arabic ? "تقرير العمليات حسب الإدارة" : "Operations by department report");
  summary.mergeCells("A1:F1");
  summary.getCell("A1").value = heading;
  summary.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF0B6A9A" }, name: "Arial" };
  summary.getCell("A2").value = `${formatLongDate(todayISO(), locale)} · ${rows.length}`;

  const byDept = new Map<string, { label: string; count: number; overdue: number; amount: string }>();
  for (const row of rows) {
    const key = `${row.departmentAr}||${row.departmentEn}`;
    const label = locName(locale, row.departmentAr, row.departmentEn);
    const bucket = byDept.get(key) ?? { label, count: 0, overdue: 0, amount: "0.00" };
    bucket.count += 1;
    if (row.status === "overdue") bucket.overdue += 1;
    bucket.amount = addMoney(bucket.amount, row.currentAmount);
    byDept.set(key, bucket);
  }
  const summaryHeader = summary.addRow(
    arabic
      ? ["الإدارة", "عدد التخصيصات", "متأخرة", "إجمالي الاعتماد", "النسبة المتأخرة %"]
      : ["Department", "Assignments", "Overdue", "Total funding", "Overdue %"],
  );
  styleHeader(summaryHeader, locale);
  for (const bucket of byDept.values()) {
    const pct = bucket.count ? Math.round((bucket.overdue / bucket.count) * 100) : 0;
    const added = summary.addRow([bucket.label, bucket.count, bucket.overdue, bucket.amount, pct]);
    added.eachCell((cell, col) => {
      cell.font = { name: "Arial", size: 12 };
      cell.alignment = { horizontal: arabic ? "right" : col >= 2 ? "center" : "left" };
      if (col === 4) cell.numFmt = "#,##0.00";
    });
  }
  summary.columns.forEach((column) => {
    column.width = 22;
  });
  summary.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3 + byDept.size, column: 5 } };

  details.mergeCells("A1:L1");
  details.getCell("A1").value = heading;
  details.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF0B6A9A" }, name: "Arial" };
  details.getCell("A2").value = `${formatLongDate(todayISO(), locale)} · ${rows.length}`;
  const detailHeader = details.addRow(
    arabic
      ? [
          "العملية",
          "النوع",
          "الإدارة",
          "الموافقة الفنية",
          "الاعتماد الأصلي",
          "الاعتماد الحالي",
          "الحالة",
          "المراحل",
          "دفعات الاعتماد",
          "مجموع الدفعات",
        ]
      : [
          "Operation",
          "Type",
          "Department",
          "Technical approval",
          "Approved amount",
          "Current amount",
          "Status",
          "Stages",
          "Funding tranches",
          "Tranches total",
        ],
  );
  styleHeader(detailHeader, locale);
  for (const row of rows) {
    const added = details.addRow([
      locName(locale, row.operationAr, row.operationEn),
      locName(locale, row.typeAr, row.typeEn),
      locName(locale, row.departmentAr, row.departmentEn),
      formatDate(row.approvalDate),
      row.approvedAmount,
      row.currentAmount,
      statusLabel(locale, row.status),
      arabic ? row.stagesSummaryAr : row.stagesSummaryEn,
      row.tranchesSummary || "—",
      row.fundingTotal,
    ]);
    added.eachCell((cell, col) => {
      cell.font = { name: "Arial", size: 11 };
      cell.alignment = { horizontal: arabic ? "right" : "left", wrapText: true, vertical: "top" };
      if (col === 4) cell.numFmt = "dd/mm/yyyy";
      if (col === 5 || col === 6 || col === 10) cell.numFmt = "#,##0.00";
    });
  }
  details.columns.forEach((column, index) => {
    column.width = [28, 18, 22, 14, 14, 14, 12, 42, 28, 14][index] ?? 18;
  });
  details.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: 3 + Math.max(rows.length, 1), column: 10 },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
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
