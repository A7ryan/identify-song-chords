import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  // Handle CORS preflight request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    // Get the file from the request
    const contentType = event.headers["content-type"] || "";
    
    if (!contentType.includes("multipart/form-data")) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "Expected form data" }),
      };
    }

    // Forward the exact same request to the backend
    const response = await fetch(
      "https://chordmini-backend-191567167632.us-central1.run.app/api/recognize-chords",
      {
        method: "POST",
        headers: {
          // Forward necessary headers
          "Content-Type": event.headers["content-type"] || "multipart/form-data",
        },
        body: event.body, // Forward the raw body
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Backend error: ${errText}`);
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (err: any) {
    console.error(err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
};
