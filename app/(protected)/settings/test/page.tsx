"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function TestPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const testAI = async () => {
    try {
      setError("");
      setOutput("");
      setLoading(true);

      const genAI = new GoogleGenerativeAI(
        "AIzaSyCWsROMklmIF9qGz9b3DgnHXWbupES_8bo"
      );
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      setOutput("Testing API connection...");

      const prompt = input || "Say hello and introduce yourself briefly!";
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setOutput(
        `API Test successful!\n\nPrompt: ${prompt}\n\nResponse: ${text}`
      );
    } catch (error) {
      console.error("Test error:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Gemini AI Test Page</h1>
        <p className="text-muted-foreground">
          Use this page to test your Gemini AI integration
        </p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Input (Optional)</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your test prompt here..."
            className="min-h-[100px]"
          />
        </div>

        <Button onClick={testAI} disabled={loading}>
          {loading ? "Testing..." : "Test Connection"}
        </Button>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
            <p className="font-medium">Error:</p>
            <pre className="mt-2 text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {output && (
          <div className="p-4 rounded-lg bg-muted">
            <p className="font-medium">Output:</p>
            <pre className="mt-2 text-sm whitespace-pre-wrap">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
