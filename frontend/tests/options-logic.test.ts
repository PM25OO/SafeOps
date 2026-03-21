import {
  normalizeBackendBaseUrl,
  normalizeParserRules,
  parseImportedOptions,
  parseParserRulesText,
} from "../src/options-logic";

describe("options-logic", () => {
  test("normalizeBackendBaseUrl strips trailing slash and validates protocol", () => {
    expect(normalizeBackendBaseUrl(" http://localhost:8000/ ")).toBe("http://localhost:8000");
    expect(normalizeBackendBaseUrl("https://demo.local/api/")).toBe("https://demo.local/api");
    expect(() => normalizeBackendBaseUrl("localhost:8000")).toThrow(/格式不正确|仅支持 http 或 https/);
    expect(() => normalizeBackendBaseUrl("ws://localhost:8000")).toThrow("仅支持 http 或 https");
  });

  test("normalizeParserRules trims and deduplicates selectors", () => {
    const rules = normalizeParserRules({
      alertId: ["  #a  ", "#a", "", " .x "],
      severity: ["[data-sev]", "[data-sev]"],
    });

    expect(rules).toEqual({
      alertId: ["#a", ".x"],
      severity: ["[data-sev]"],
    });
  });

  test("parseParserRulesText returns empty object for blank input", () => {
    expect(parseParserRulesText("\n\t")).toEqual({});
  });

  test("parseImportedOptions supports parser-rules only json", () => {
    const imported = parseImportedOptions(
      JSON.stringify({
        alertId: ["#alert-id"],
        severity: ["[data-level]"],
      }),
      {
        query_asset: true,
        watch_alert: true,
        collect_forensics: true,
        create_incident_ticket: true,
        block_ip: true,
        isolate_host: false,
        auto_restart_server: false,
      },
    );

    expect(imported).toEqual({
      parserRules: {
        alertId: ["#alert-id"],
        severity: ["[data-level]"],
      },
    });
  });

  test("parseImportedOptions handles full settings json and merges allowlist", () => {
    const imported = parseImportedOptions(
      JSON.stringify({
        backendBaseUrl: "https://safeops.local/",
        apiKey: "  key-1  ",
        allowlist: {
          block_ip: false,
          isolate_host: true,
        },
        parserRules: {
          title: [".title"],
        },
      }),
      {
        query_asset: true,
        watch_alert: false,
        collect_forensics: true,
        create_incident_ticket: true,
        block_ip: true,
        isolate_host: false,
        auto_restart_server: false,
      },
    );

    expect(imported).toEqual({
      backendBaseUrl: "https://safeops.local",
      apiKey: "key-1",
      allowlist: {
        query_asset: true,
        watch_alert: false,
        collect_forensics: true,
        create_incident_ticket: true,
        block_ip: false,
        isolate_host: true,
        auto_restart_server: false,
      },
      parserRules: {
        title: [".title"],
      },
    });
  });
});