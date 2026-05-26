export async function fetchIfscResultsPage(url: string): Promise<string> {
  const parsedUrl = new URL(url);

  if (parsedUrl.hostname !== "ifsc.results.info") {
    throw new Error("Only ifsc.results.info URLs are supported.");
  }

  const response = await fetch(parsedUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}
