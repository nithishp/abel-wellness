import * as sdk from "node-appwrite";

export const {
  PROJECT_ID,
  DATABASE_ID,
  APPOINTMENTS_ID,
  BLOGS_ID,
  ADMINS_ID,
  API_KEY,
  NEXT_PUBLIC_ENDPOINT: ENDPOINT,
} = process.env;

// Server-side client for admin operations
const client = new sdk.Client();
client
  .setEndpoint(ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

// Client-side client for public operations
const clientSide = new sdk.Client();
clientSide
  .setEndpoint(ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(PROJECT_ID);

export const databases = new sdk.Databases(client);
export const account = new sdk.Account(clientSide);
export const storage = new sdk.Storage(client);

// Client-side databases for public operations
export const clientDatabases = new sdk.Databases(clientSide);
