import { JSDOM } from "jsdom";
import { parseAlertContext } from "../src/parser/dom-parser";

describe("parseAlertContext", () => {
  test("extracts known alert fields from DOM", () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <h1>Suspicious Login Attempt</h1>
          <div data-alert-id="ALT-2026-0001"></div>
          <span data-severity="critical"></span>
          <span data-source-ip="1.2.3.4"></span>
          <span data-asset="prod-web-01"></span>
          <time>2026-03-20T10:00:00Z</time>
        </body>
      </html>
    `);

    const result = parseAlertContext(dom.window.document);

    expect(result.alertId).toBe("ALT-2026-0001");
    expect(result.severity).toBe("critical");
    expect(result.sourceIp).toBe("1.2.3.4");
    expect(result.asset).toBe("prod-web-01");
  });

  test("falls back to low severity for unknown value", () => {
    const dom = new JSDOM(`
      <html>
        <body>
          <div id="alert-id">ALT-2026-0002</div>
          <div class="severity">SEV_UNKNOWN</div>
        </body>
      </html>
    `);

    const result = parseAlertContext(dom.window.document);
    expect(result.severity).toBe("low");
  });
});
