"use client";
import { useState, useEffect } from "react";
import {
  clientDatabases,
  CLIENT_DATABASE_ID,
  CLIENT_BLOGS_ID,
} from "@/lib/appwrite.client";
import { databases, DATABASE_ID, BLOGS_ID } from "@/lib/appwrite.config";

const DiagnosticPage = () => {
  const [results, setResults] = useState({
    clientConfig: null,
    serverConfig: null,
    error: null,
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      console.log("Environment variables:");
      console.log(
        "NEXT_PUBLIC_PROJECT_ID:",
        process.env.NEXT_PUBLIC_PROJECT_ID
      );
      console.log(
        "NEXT_PUBLIC_DATABASE_ID:",
        process.env.NEXT_PUBLIC_DATABASE_ID
      );
      console.log("NEXT_PUBLIC_BLOGS_ID:", process.env.NEXT_PUBLIC_BLOGS_ID);
      console.log("CLIENT_DATABASE_ID:", CLIENT_DATABASE_ID);
      console.log("CLIENT_BLOGS_ID:", CLIENT_BLOGS_ID);
      console.log("DATABASE_ID:", DATABASE_ID);
      console.log("BLOGS_ID:", BLOGS_ID);

      setResults({
        clientConfig: {
          projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
          databaseId: CLIENT_DATABASE_ID,
          blogsId: CLIENT_BLOGS_ID,
        },
        serverConfig: {
          databaseId: DATABASE_ID,
          blogsId: BLOGS_ID,
        },
        error: null,
      });

      // Test client connection
      try {
        await clientDatabases.listDocuments(
          CLIENT_DATABASE_ID,
          CLIENT_BLOGS_ID,
          []
        );
        console.log("Client connection successful");
      } catch (clientError) {
        console.error("Client connection error:", clientError);
        setResults((prev) => ({
          ...prev,
          error: clientError.message,
        }));
      }
    } catch (error) {
      console.error("Diagnostic error:", error);
      setResults((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Appwrite Diagnostic</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Environment Configuration</h2>
          <div className="space-y-2">
            <div>
              <strong>Project ID:</strong>{" "}
              {process.env.NEXT_PUBLIC_PROJECT_ID || "Not set"}
            </div>
            <div>
              <strong>Database ID:</strong> {CLIENT_DATABASE_ID || "Not set"}
            </div>
            <div>
              <strong>Blogs Collection ID:</strong>{" "}
              {CLIENT_BLOGS_ID || "Not set"}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Configuration Results</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>

        {results.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Error</h2>
            <p className="text-red-700">{results.error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-blue-800 mb-4">Instructions</h2>
          <div className="text-blue-700 space-y-2">
            <p>
              1. Make sure you have created the database and collections in your
              Appwrite console
            </p>
            <p>
              2. Verify that the collection IDs in your .env.local file match
              the actual collection IDs from Appwrite
            </p>
            <p>3. Check that your project ID is correct</p>
            <p>
              4. Ensure you have set the correct permissions for the collections
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
