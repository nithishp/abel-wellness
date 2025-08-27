"use client";
import { useEffect, useState } from "react";

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    // This will show us what environment variables are available on the client
    const vars = {
      NEXT_PUBLIC_ENDPOINT: process.env.NEXT_PUBLIC_ENDPOINT,
      NEXT_PUBLIC_PROJECT_ID: process.env.NEXT_PUBLIC_PROJECT_ID,
      NEXT_PUBLIC_DATABASE_ID: process.env.NEXT_PUBLIC_DATABASE_ID,
      NEXT_PUBLIC_BLOGS_ID: process.env.NEXT_PUBLIC_BLOGS_ID,
      // Server-side vars (should be undefined on client)
      DATABASE_ID: process.env.DATABASE_ID,
      BLOGS_ID: process.env.BLOGS_ID,
    };
    setEnvVars(vars);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Environment Variables Debug</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
