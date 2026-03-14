/**
 * {{projectName}} - GAS Web App
 *
 * This script serves a web application via Google Apps Script.
 * doGet handles HTTP GET requests and serves the HTML page.
 */

/** Handle HTTP GET requests. Serves the main HTML page. */
function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile("client")
    .setTitle("{{projectName}}")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Handle HTTP POST requests. */
function doPost(
  e: GoogleAppsScript.Events.DoPost,
): GoogleAppsScript.Content.TextOutput {
  const data = JSON.parse(e.postData.contents);
  const result = processRequest(data);
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Process incoming request data. */
function processRequest(data: Record<string, unknown>): Record<string, unknown> {
  return {
    status: "ok",
    received: data,
    timestamp: new Date().toISOString(),
  };
}
