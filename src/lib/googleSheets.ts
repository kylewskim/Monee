import { google, type drive_v3, type sheets_v4 } from "googleapis";

function getOAuthClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

export function getSheetsClient(accessToken: string): sheets_v4.Sheets {
  return google.sheets({ version: "v4", auth: getOAuthClient(accessToken) });
}

export function getDriveClient(accessToken: string): drive_v3.Drive {
  return google.drive({ version: "v3", auth: getOAuthClient(accessToken) });
}

export async function readSheetRange(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  range: string
): Promise<Array<Array<string | number>>> {
  const sheets = getSheetsClient(accessToken);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${tabName}'!${range}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return (res.data.values as Array<Array<string | number>>) ?? [];
}

export async function writeSheetRange(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  range: string,
  values: Array<Array<string | number>>
): Promise<void> {
  const sheets = getSheetsClient(accessToken);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${tabName}'!${range}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
