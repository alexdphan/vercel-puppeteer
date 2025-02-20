import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import { NodeHtmlMarkdown } from "node-html-markdown";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Connect to browser and create new page
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}`,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    // Get HTML content from the entire document
    const html = await page.evaluate(() => {
      return document.documentElement.outerHTML;
    });

    // Cleanup resources
    await browser.close();

    // Convert to markdown and validate
    const markdown = NodeHtmlMarkdown.translate(html).trim();
    if (!markdown) {
      throw new Error("No content found on the page");
    }

    return NextResponse.json({ markdown });
  } catch (error) {
    console.error("Error processing URL:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch URL" },
      { status: 500 }
    );
  }
}
