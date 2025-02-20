import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import prettier from "prettier";
import htmlParser from "prettier/parser-html";

// API route handler for GET requests
export async function GET(req: Request) {
  try {
    const url = new URL(req.url).searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    // creating and connecting to a browser session using Browserbase
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}`,
    });

    // Create a new page/tab in the browser
    const page = await browser.newPage();

    // Navigate to URL and wait until network is idle (no requests for 500ms)
    await page.goto(url, { waitUntil: "networkidle0" });

    // Get the entire HTML content of the page by evaluating JS in the browser context
    const html = await page.evaluate(
      () => document.querySelector("*")?.outerHTML
    );

    // Format the HTML string using prettier with HTML parser plugin
    const formattedHtml = await prettier.format(html || "", {
      parser: "html",
      plugins: [htmlParser],
    });

    // Close the page/tab
    await page.close();

    // Close the browser completely
    await browser.close();

    // respond with json, in the formatted HTML format
    return NextResponse.json({ html: formattedHtml });
  } catch (error) {
    // Log the error to console
    console.error("Scraping error:", error);

    // Return error response with message and error details
    return NextResponse.json(
      {
        message: "Failed to scrape content",
        // If error is Error instance, use its message, otherwise use generic message
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
