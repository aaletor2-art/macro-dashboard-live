import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";

const root = process.cwd();
const publicDir = path.join(root, "public");
const exportDir = path.join(publicDir, "daily_exports");
const dataDir = path.join(publicDir, "data");
const today = new Date().toISOString().slice(0, 10);

const assets = [
  ["Australian Dollar", "AUDUSD=X", "USD per 1 AUD", false],
  ["Canadian Dollar", "CAD=X", "USD per 1 CAD", true],
  ["Swiss Franc", "CHF=X", "USD per 1 CHF", true],
  ["Euro", "EURUSD=X", "USD per 1 EUR", false],
  ["British Pound", "GBPUSD=X", "USD per 1 GBP", false],
  ["Japanese Yen", "JPY=X", "USD per 1 JPY", true],
  ["New Zealand Dollar", "NZDUSD=X", "USD per 1 NZD", false],
  ["US Dollar Index", "DX-Y.NYB", "Index points", false],
  ["Gold", "GC=F", "USD futures price", false],
  ["Silver", "SI=F", "USD futures price", false],
  ["WTI Crude", "CL=F", "USD futures price", false],
  ["Brent Crude", "BZ=F", "USD futures price", false],
  ["Natural Gas", "NG=F", "USD futures price", false],
  ["Copper", "HG=F", "USD futures price", false],
  ["Corn", "ZC=F", "USD futures price", false],
  ["Wheat", "ZW=F", "USD futures price", false],
  ["Soybeans", "ZS=F", "USD futures price", false],
  ["Coffee", "KC=F", "USD futures price", false],
  ["Cocoa", "CC=F", "USD futures price", false]
];

const calendarLines = [
  ["AUD", "Business Confidence", "Previous 4.0; Last -29.0; Forecast -34.0", "Sharply weaker confidence in the template calendar."],
  ["GBP", "Business Confidence", "Previous -19.0; Last -65.0; Forecast -20.0", "Large downside surprise versus previous reading."],
  ["EUR", "Consumer Confidence", "Previous -16.4; Last -20.6; Forecast -17.0", "Consumer confidence weaker than prior level."],
  ["CAD", "Business Confidence", "Previous 49.7; Last 57.7; Forecast 50.0", "Improved versus previous reading."],
  ["NZD", "Services PMI Forecast", "Last 46.0; Forecast 51.0", "Forecast points to a move back above 50."],
  ["CHF", "Manufacturing PMI Forecast", "Last 54.5; Forecast 48.8", "Forecast implies contraction risk."],
  ["AUD", "Services PMI", "Previous 46.3; Last 50.7; Forecast 49.0", "Latest reading moved back above 50."],
  ["CAD", "Manufacturing PMI", "Previous 50.0; Last 53.3; Forecast 50.1", "Manufacturing improved versus previous reading."]
];

async function fetchYahooDaily(symbol, invert) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${symbol}: HTTP ${response.status}`);
  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  if (!result) throw new Error(`${symbol}: no chart result`);
  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  for (let i = timestamps.length - 1; i >= 0; i -= 1) {
    const open = quote.open?.[i];
    const close = quote.close?.[i];
    if (open == null || close == null) continue;
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
    return {
      date,
      open: invert ? 1 / open : open,
      close: invert ? 1 / close : close
    };
  }
  throw new Error(`${symbol}: no complete daily open/close row`);
}

function styleSheet(sheet) {
  sheet.views = [{ state: "frozen", ySplit: 3 }];
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E6F8F" } };
  sheet.getRow(3).font = { bold: true };
  sheet.getRow(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCEEF6" } };
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: "FFD9DFD9" } } };
      cell.alignment = { vertical: "middle" };
    });
  });
  sheet.columns.forEach((column) => {
    let width = 10;
    column.eachCell({ includeEmpty: true }, (cell) => {
      width = Math.max(width, String(cell.value ?? "").length + 2);
    });
    column.width = Math.min(width, 32);
  });
}

async function main() {
  await fs.mkdir(exportDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  const rows = [];
  for (const [asset, symbol, convention, invert] of assets) {
    try {
      const quote = await fetchYahooDaily(symbol, invert);
      rows.push({
        date: quote.date,
        asset,
        symbol,
        convention,
        open: quote.open,
        close: quote.close,
        move: quote.close - quote.open,
        pctMove: quote.open ? quote.close / quote.open - 1 : null
      });
    } catch (error) {
      rows.push({ date: today, asset, symbol, convention, open: null, close: null, move: null, pctMove: null, error: String(error.message || error) });
    }
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Macro Dashboard";
  workbook.created = new Date();

  const prices = workbook.addWorksheet("Daily Prices");
  prices.addRow([`Daily Asset Open/Close Export - ${today}`]);
  prices.addRow([]);
  prices.addRow(["Date", "Asset", "Symbol", "Convention", "Open", "Close", "Move", "% Move"]);
  for (const row of rows) {
    prices.addRow([row.date, row.asset, row.symbol, row.convention, row.open, row.close, row.move, row.pctMove]);
  }
  prices.getColumn(5).numFmt = "#,##0.0000";
  prices.getColumn(6).numFmt = "#,##0.0000";
  prices.getColumn(7).numFmt = "#,##0.0000";
  prices.getColumn(8).numFmt = "0.00%";
  styleSheet(prices);

  const calendar = workbook.addWorksheet("Economic Calendar");
  calendar.addRow([`Short Economic Calendar Lines - ${today}`]);
  calendar.addRow([]);
  calendar.addRow(["Currency", "Event", "Previous / Last / Forecast", "Short Line"]);
  calendarLines.forEach((line) => calendar.addRow(line));
  calendar.getColumn(4).alignment = { wrapText: true };
  styleSheet(calendar);

  const sources = workbook.addWorksheet("Sources");
  sources.addRow([`Sources - ${today}`]);
  sources.addRow([]);
  sources.addRow(["Source", "Use", "URL / Notes"]);
  [
    ["Yahoo Finance chart endpoint", "Daily asset open/close", "https://query1.finance.yahoo.com/v8/finance/chart/"],
    ["Macro Database 2.xlsx template", "Economic calendar short lines", "Template-derived values and notes"],
    ["Reuters", "Optional enrichment", "Not enabled in this non-Reuters run"],
    ["FXStreet", "Optional calendar enrichment", "https://www.fxstreet.com/economic-calendar"],
    ["Trading Economics", "Optional calendar/API enrichment", "https://tradingeconomics.com/calendar"]
  ].forEach((line) => sources.addRow(line));
  styleSheet(sources);

  const filename = `macro_daily_export_${today}.xlsx`;
  const filePath = path.join(exportDir, filename);
  await workbook.xlsx.writeFile(filePath);

  await fs.writeFile(path.join(dataDir, "latest-export.json"), JSON.stringify({
    date: today,
    filename,
    href: `/daily_exports/${filename}`,
    generatedAt: new Date().toISOString(),
    assets: rows.map(({ error, ...row }) => row),
    calendarLines
  }, null, 2));

  console.log(`Wrote ${filePath}`);
}

await main();
