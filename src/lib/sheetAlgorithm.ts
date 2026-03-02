import { readSheetRange, writeSheetRange } from "./googleSheets";

// Day of week → 1-based starting column in spreadsheet
// Sun=4(D), Mon=7(G), Tue=10(J), Wed=13(M), Thu=16(P), Fri=19(S), Sat=22(V)
function getDayColStart(dayOfWeek: number): number {
  return 4 + dayOfWeek * 3;
}

// Convert 1-based row + col to A1 notation
function toA1(row: number, col: number): string {
  let colStr = "";
  let c = col;
  while (c > 0) {
    const rem = (c - 1) % 26;
    colStr = String.fromCharCode(65 + rem) + colStr;
    c = Math.floor((c - 1) / 26);
  }
  return `${colStr}${row}`;
}

// Get the tab name for a given year/month (0-indexed month)
export function getTabName(year: number, month: number): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[month]}/${year}`;
}

// Get the tab name for the current month
export function getCurrentTabName(): string {
  const now = new Date();
  return getTabName(now.getFullYear(), now.getMonth());
}

// Find the 1-based sheet row for the date row of the week containing dayOfMonth
function getDateRowForDay(dayOfMonth: number, firstDowOfMonth: number): number {
  const weekIndex = Math.floor((dayOfMonth - 1 + firstDowOfMonth) / 7);
  return 3 + weekIndex * 7; // 1-based
}

export interface CellLocation {
  row: number;
  col: number;
  tabName: string;
}

// Find the next available entry slot for a given date
export async function findNextEmptySlot(
  accessToken: string,
  dateStr: string
): Promise<CellLocation> {
  const date = new Date(dateStr + "T12:00:00"); // avoid UTC offset issues
  const year = date.getFullYear();
  const month = date.getMonth();
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay(); // 0=Sun

  const firstDow = new Date(year, month, 1).getDay();
  const tabName = getTabName(year, month);
  const colStart = getDayColStart(dayOfWeek);
  const dateRow = getDateRowForDay(dayOfMonth, firstDow);

  // Entry rows are dateRow+1 through dateRow+5
  const entryStartRow = dateRow + 1;
  const entryEndRow = dateRow + 5;

  // Read the source column for those 5 rows to find the first empty one
  const rangeStart = toA1(entryStartRow, colStart);
  const rangeEnd = toA1(entryEndRow, colStart);
  const values = await readSheetRange(accessToken, tabName, `${rangeStart}:${rangeEnd}`);

  let targetRow = entryStartRow;
  let found = false;
  for (let i = 0; i < 5; i++) {
    const cellVal = values?.[i]?.[0];
    if (!cellVal || cellVal.toString().trim() === "") {
      targetRow = entryStartRow + i;
      found = true;
      break;
    }
  }
  if (!found) {
    throw new Error("This day is full (5 entries max). Please check the spreadsheet.");
  }

  return { row: targetRow, col: colStart, tabName };
}

// Write a single entry to the spreadsheet
export async function writeEntry(
  accessToken: string,
  dateStr: string,
  source: string,
  category: string,
  amount: number
): Promise<CellLocation> {
  const location = await findNextEmptySlot(accessToken, dateStr);
  const rangeStart = toA1(location.row, location.col);
  const rangeEnd = toA1(location.row, location.col + 2);
  await writeSheetRange(
    accessToken,
    location.tabName,
    `${rangeStart}:${rangeEnd}`,
    [[source, category, amount]]
  );
  return location;
}
