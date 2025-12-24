"use client";
import { useState, useEffect } from "react";
import { supabase, TABLES } from "@/lib/supabase.client";

const DiagnosticPage = () => {
  const [results, setResults] = useState({
    config: null,
    connection: null,
    error: null,
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      console.log("Environment variables:");
      console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
      console.log("Has Anon Key:", hasAnonKey);

      setResults({
        config: {
          supabaseUrl: supabaseUrl || "Not set",
          hasAnonKey,
          tables: TABLES,
        },
        connection: null,
        error: null,
      });

      // Test connection by fetching blogs
      try {
        const { data, error } = await supabase
          .from(TABLES.BLOGS)
          .select("id")
          .limit(1);

        if (error) {
          throw error;
        }

        console.log("Supabase connection successful");
        setResults((prev) => ({
          ...prev,
          connection: {
            status: "success",
            message: "Successfully connected to Supabase",
          },
        }));
      } catch (connError) {
        console.error("Connection error:", connError);
        setResults((prev) => ({
          ...prev,
          connection: {
            status: "error",
            message: connError.message,
          },
          error: connError.message,
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
        <h1 className="text-3xl font-bold mb-8">Supabase Diagnostic</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Environment Configuration</h2>
          <div className="space-y-2">
            <div>
              <strong>Supabase URL:</strong>{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}
            </div>
            <div>
              <strong>Anon Key:</strong>{" "}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"}
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
              1. Make sure you have created a Supabase project and run the
              migrations
            </p>
            <p>
              2. Verify that the environment variables in .env.local are correct
            </p>
            <p>3. Check that your Supabase URL and anon key are valid</p>
            <p>
              4. Ensure RLS policies are configured correctly for the tables
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
