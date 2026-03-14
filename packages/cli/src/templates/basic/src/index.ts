/**
 * {{projectName}} - Basic GAS Script
 *
 * This script runs as a Google Apps Script project.
 * The onOpen function is automatically triggered when the spreadsheet is opened.
 */

/** Triggered when the spreadsheet is opened. Creates a custom menu. */
function onOpen(): void {
  SpreadsheetApp.getUi()
    .createMenu("{{projectName}}")
    .addItem("Run script", "runScript")
    .addToUi();
}

/** Example function that can be called from the custom menu. */
function runScript(): void {
  const sheet = SpreadsheetApp.getActiveSheet();
  const message = greet(sheet.getName());
  SpreadsheetApp.getUi().alert(message);
}

/** Generate a greeting message. */
function greet(name: string): string {
  return `Hello from {{projectName}}! Current sheet: ${name}`;
}
