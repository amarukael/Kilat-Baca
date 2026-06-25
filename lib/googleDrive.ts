import { google } from "googleapis";

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!) as object;

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export const drive = google.drive({ version: "v3", auth });
export const DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;
