import * as cheerio from "cheerio";

export interface IfscParsedRankingsPage {
  title: string | null;
  rankings: unknown[];
}

export function parseRankings(html: string): IfscParsedRankingsPage {
  const $ = cheerio.load(html);
  const title = $("title").first().text().trim() || null;

  return {
    title,
    rankings: []
  };
}
