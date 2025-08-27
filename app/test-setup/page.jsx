"use client";
import { useState } from "react";
import { adminLogin, getCurrentAdmin } from "@/lib/actions/admin.actions";
import { getPublishedBlogs, createBlog } from "@/lib/actions/blog.actions";

const TestSetup = () => {
  const [results, setResults] = useState("");
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setResults("Starting tests...\n");

    try {
      // Test 1: Check environment variables
      setResults((prev) => prev + "\n1. Testing environment variables:\n");
      setResults(
        (prev) =>
          prev + `   PROJECT_ID: ${process.env.NEXT_PUBLIC_PROJECT_ID}\n`
      );
      setResults(
        (prev) =>
          prev + `   DATABASE_ID: ${process.env.NEXT_PUBLIC_DATABASE_ID}\n`
      );
      setResults(
        (prev) => prev + `   ENDPOINT: ${process.env.NEXT_PUBLIC_ENDPOINT}\n`
      );

      // Test 2: Try to fetch blogs (should work even if empty)
      setResults((prev) => prev + "\n2. Testing blog fetch:\n");
      const blogs = await getPublishedBlogs(5);
      setResults(
        (prev) => prev + `   Blogs fetched: ${blogs.documents.length} blogs\n`
      );

      // Test 3: Try admin login
      setResults((prev) => prev + "\n3. Testing admin login:\n");
      try {
        const session = await adminLogin("abelwhcc@gmail.com", "Abel2001");
        setResults(
          (prev) => prev + `   Login successful: ${session ? "✅" : "❌"}\n`
        );

        // Test 4: Get current admin
        const admin = await getCurrentAdmin();
        setResults(
          (prev) =>
            prev +
            `   Admin info: ${admin ? admin.email || "No email" : "No admin"}\n`
        );
      } catch (loginError) {
        setResults((prev) => prev + `   Login failed: ${loginError.message}\n`);
        setResults(
          (prev) =>
            prev + "   Make sure you've created the user in Appwrite Auth!\n"
        );
      }

      setResults((prev) => prev + "\n✅ Tests completed!\n");
    } catch (error) {
      setResults((prev) => prev + `\n❌ Error: ${error.message}\n`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Appwrite Setup Test</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p className="mb-4">
            This will test your Appwrite configuration and help identify any
            issues.
          </p>

          <button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Running Tests..." : "Run Setup Tests"}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Test Results</h2>
          <pre className="bg-gray-100 p-4 rounded min-h-64 whitespace-pre-wrap text-sm">
            {results || "Click the button above to run tests..."}
          </pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            Setup Checklist
          </h2>
          <div className="text-yellow-700 space-y-2">
            <p>☐ Enable Email/Password authentication in Appwrite Console</p>
            <p>☐ Create database collections: blogs, appointments, admins</p>
            <p>☐ Set proper permissions for collections</p>
            <p>☐ Create admin user in Appwrite Auth</p>
            <p>☐ Verify all environment variables are correct</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSetup;
