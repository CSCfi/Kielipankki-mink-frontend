import { describe, expect, test } from "vitest";
import Yaml from "js-yaml";
import {
  makeConfig,
  parseConfig,
  type ConfigOptions,
  validateConfig,
} from "@/api/corpusConfig";

describe("makeConfig", () => {
  test("sets minimal info", () => {
    const yaml = makeConfig("mink-abc123", {
      name: { swe: "Nyheter", eng: "News" },
      language: "swe",
      format: "txt",
      annotations: {},
    });
    expect(yaml).toContain("id: mink-abc123");
    expect(yaml).toContain("swe: Nyheter");
    expect(yaml).toContain("eng: News");
    expect(yaml).toContain("language: swe");
    expect(yaml).toContain("importer: text_import:parse");
    expect(yaml).not.toContain("- <token>:saldo.baseform2 as lemma");
  });

  test("sets segmenter", () => {
    const yaml = makeConfig("mink-abc123", {
      name: { swe: "Nyheter", eng: "News" },
      language: "swe",
      format: "txt",
      sentenceSegmenter: "linebreaks",
      annotations: {},
    });
    expect(yaml).toContain("sentence_segmenter: linebreaks");
  });

  test("sets text_annotation", () => {
    const yaml = makeConfig("mink-abc123", {
      name: { swe: "Nyheter", eng: "News" },
      language: "swe",
      format: "xml",
      textAnnotation: "article",
      annotations: {},
    });
    expect(yaml).toContain("text_annotation: article");
    expect(yaml).toContain("- article as text");
  });

  test("sets pdf annotations", () => {
    const yaml = makeConfig("mink-abc123", {
      name: { swe: "Nyheter", eng: "News" },
      language: "swe",
      format: "pdf",
      annotations: {},
    });
    expect(yaml).toContain("- text");
    expect(yaml).toContain("- page:number");
  });

  test("sets timespan info", () => {
    const yaml = makeConfig("mink-abc123", {
      name: { swe: "Nyheter", eng: "News" },
      language: "swe",
      format: "pdf",
      annotations: {
        datetime: {
          from: "2000-01-01",
          to: "2023-12-31",
        },
      },
    });
    expect(yaml).toContain("datetime_from: <text>:misc.datefrom");
    expect(yaml).toContain("datetime_to: <text>:misc.dateto");
    expect(yaml).toContain("datetime_informat: '%Y-%m-%d'");
    expect(yaml).toContain("value: '2000-01-01'");
    expect(yaml).toContain("value: '2023-12-31'");
    expect(yaml).toContain("- <text>:dateformat.datefrom");
  });

  test("sets NER info", () => {
    const yaml = makeConfig("mink-abc123", {
      name: { swe: "Nyheter", eng: "News" },
      language: "swe",
      format: "pdf",
      annotations: {
        swener: true,
      },
    });
    expect(yaml).toContain("- swener.ne:swener.name");
  });
});

describe("parseConfig", () => {
  test("handle minimal info", () => {
    const configYaml = Yaml.dump({
      metadata: { name: { swe: "Nyheter", eng: "News" } },
      import: { importer: "text_import:parse" },
    });
    const config = parseConfig(configYaml);
    expect(config.name).toStrictEqual({ swe: "Nyheter", eng: "News" });
    expect(config.format).toBe("txt");
  });

  test("requires format", () => {
    const configYaml = Yaml.dump({
      metadata: { name: { swe: "Nyheter", eng: "News" } },
    });
    expect(() => parseConfig(configYaml)).toThrowError();
  });

  test("requires name", () => {
    const configYaml = Yaml.dump({
      import: { importer: "text_import:parse" },
    });
    expect(() => parseConfig(configYaml)).toThrowError();
  });

  test("handle full info", () => {
    const configYaml = Yaml.dump({
      metadata: {
        name: { swe: "Nyheter", eng: "News" },
        description: { swe: "Senaste nytt", eng: "Latest news" },
        language: "swe",
      },
      import: {
        importer: "xml_import:parse",
        text_annotation: "article",
      },
      segment: { sentence_segmenter: "linebreaks" },
      custom_annotations: [
        { params: { out: "<text>:misc.datefrom", value: "2000-01-01" } },
        { params: { out: "<text>:misc.dateto", value: "2023-12-31" } },
      ],
      export: {
        annotations: ["<text>:readability.lix", "swener.ne"],
      },
    });
    const config = parseConfig(configYaml);
    const expected: ConfigOptions = {
      format: "xml",
      language: "swe",
      name: { swe: "Nyheter", eng: "News" },
      description: { swe: "Senaste nytt", eng: "Latest news" },
      textAnnotation: "article",
      sentenceSegmenter: "linebreaks",
      annotations: {
        datetime: {
          from: "2000-01-01",
          to: "2023-12-31",
        },
        lexicalClasses: false,
        msd: false,
        ner: false,
        readability: true,
        saldo: false,
        sensaldo: false,
        swener: true,
        syntax: false,
        treetagger: false,
        wsd: false,
      },
    };
    expect(config).toStrictEqual(expected);
  });
});

describe("validateConfig", () => {
  test("missing text annotation", () => {
    const options: ConfigOptions = {
      name: { swe: "Nyheter", eng: "News" },
      language: "swe",
      format: "xml",
      annotations: {},
    };

    // Config can be handled
    makeConfig("mink-abc123", options);

    // But is not ready for annotation
    expect(() => validateConfig(options)).toThrow();
  });
});
