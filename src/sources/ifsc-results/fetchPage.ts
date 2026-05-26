export const IFSC_RESULTS_HOST = "ifsc.results.info";
export const IFSC_RESULTS_USER_AGENT =
  "climbing-stats-data-poc/0.1 (+https://github.com/zyeo/climbing-stats-data-poc; manual fixture fetch)";

export function parseIfscResultsUrl(url: string): URL {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  if (parsedUrl.hostname !== IFSC_RESULTS_HOST) {
    throw new Error(`Only ${IFSC_RESULTS_HOST} URLs are supported.`);
  }

  if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error("URLs with embedded credentials are not supported.");
  }

  return parsedUrl;
}

export async function fetchIfscResultsPage(url: string): Promise<string> {
  const parsedUrl = parseIfscResultsUrl(url);
  const response = await fetch(parsedUrl, {
    headers: {
      "user-agent": IFSC_RESULTS_USER_AGENT,
      accept: "text/html,application/xhtml+xml"
    },
    redirect: "error"
  });

  if (response.status !== 200) {
    throw new Error(`Failed to fetch ${parsedUrl.href}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");

  if (contentType && !contentType.toLowerCase().includes("text/html") && !contentType.toLowerCase().includes("application/xhtml+xml")) {
    throw new Error(`Expected HTML from ${parsedUrl.href}, received content-type: ${contentType}`);
  }

  return response.text();
}
