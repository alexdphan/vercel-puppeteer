import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";

export async function GET(req: Request) {
  try {
    // Extract URL from either query params or request body
    const url = new URL(req.url).searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}`,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: "networkidle0" });

    const screenshot = await page.screenshot({ fullPage: false });

    await page.close();
    await browser.close();

    return new NextResponse(screenshot);
  } catch (error) {
    console.error("Screenshot generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate screenshot" },
      { status: 500 }
    );
  }
}
