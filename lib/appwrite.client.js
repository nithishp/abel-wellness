import { Client, Databases, Account } from "appwrite";

// Client-side configuration for public operations
const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.NEXT_PUBLIC_PROJECT_ID);

export const clientDatabases = new Databases(client);
export const account = new Account(client);
export const appwriteClient = client;

// Export the environment variables for use in actions
export const CLIENT_DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
export const CLIENT_BLOGS_ID = process.env.NEXT_PUBLIC_BLOGS_ID;

export default client;
