import { NextResponse } from "next/server";
import Browserbase from "@browserbasehq/sdk";
import puppeteer from "puppeteer-core";

// Main API route handler
// export const runtime = 'nodejs';
export const maxDuration = 300; // Set max duration to 300 seconds (5 minutes)

export async function GET(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY! });

    // Create a session
    const session = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
      browserSettings: {
        viewport: { width: 1920, height: 1080 },
      },
      keepAlive: true,
    });

    // Connect and automate using the SDK
    const browser = await puppeteer.connect({
      browserWSEndpoint: session.connectUrl,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    const screenshot = await page.screenshot();
    await browser.close();

    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set("Content-Length", screenshot.byteLength.toString());

    return new NextResponse(screenshot, { status: 200, headers });
  } catch (error) {
    console.error("Screenshot generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate screenshot",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
