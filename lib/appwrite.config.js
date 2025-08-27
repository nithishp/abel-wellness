import * as sdk from "node-appwrite";
export const {
  PROJECT_ID,
  DATABASE_ID,
  APPOINTMENTS_ID,
  API_KEY,
  NEXT_PUBLIC_ENDPOINT: ENDPOINT,
} = process.env;
const client = new sdk.Client();
client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("6721e986000024aa3068")
  .setKey(API_KEY);
export const databases = new sdk.Databases(client);
