import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // Size limit (≈10 min audio ≈ 100MB)
    const MAX_SIZE = 100 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 });
    }

    // Prepare new FormData for backend
    const backendForm = new FormData();
    backendForm.append("file", file);
    backendForm.append("model", "chord-cnn-lstm");

    const response = await fetch(
      "https://chordmini-backend-191567167632.us-central1.run.app/api/recognize-chords",
      {
        method: "POST",
        body: backendForm,
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Backend error: ${errText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
