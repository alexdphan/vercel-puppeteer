import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

async function createSession() {
  const response = await fetch(`https://www.browserbase.com/v1/sessions`, {
    method: "POST",
    headers: {
      "x-bb-api-key": process.env.BROWSERBASE_API_KEY || '',
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: process.env.BROWSERBASE_PROJECT_ID,
      keepAlive: true,
      browserSettings: {
        headless: true,
        viewport: { width: 1920, height: 1080 }
      }
    }),
  });
  const data = await response.json();
  return { id: data.id, debugUrl: data.debugUrl };
}

// Main API route handler
// export const runtime = 'nodejs';
export const maxDuration = 300; // Set max duration to 300 seconds (5 minutes)

export async function GET(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get("url");
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const { id } = await createSession();
    if (!id) {
      throw new Error('No session ID received from Browserbase');
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}&sessionId=${id}`
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle0" });
    const screenshot = await page.screenshot({ fullPage: true });
    await browser.close();

    const headers = new Headers();
    headers.set('Content-Type', 'image/png');
    headers.set('Content-Length', screenshot.byteLength.toString());
    
    return new NextResponse(screenshot, { status: 200, headers });
  } catch (error) {
    console.error("Screenshot generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate screenshot", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

