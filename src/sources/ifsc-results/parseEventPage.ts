import * as cheerio from "cheerio";

export interface IfscParsedEventPage {
  title: string | null;
  events: unknown[];
}

export function parseEventPage(html: string): IfscParsedEventPage {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || null;

  return {
    title,
    events: []
  };
}
