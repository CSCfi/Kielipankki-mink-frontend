import Yaml from "js-yaml";

import type { ByLang } from "@/util.types";
import type {
  ConfigSentenceSegmenter,
  SparvConfig,
} from "@/api/sparvConfig.types";
import { getSparvModules, parseAnnotations } from "./annotationMetadata";

export type FileFormat = "txt" | "xml" | "odt" | "docx" | "pdf";

/** Frontend-internal format of a Sparv config. */
export type ConfigOptions = {
  format: FileFormat;
  language: string; // ISO 639-3 code (e.g., "swe", "fin", "eng")
  name: ByLang;
  description?: ByLang;
  textAnnotation?: string;
  sentenceSegmenter?: ConfigSentenceSegmenter;
  annotations: AnnotationOptions;
};

export type AnnotationOptions = {
  datetime?: {
    from: string;
    to: string;
  };
  lexicalClasses?: boolean;
  msd?: boolean;
  readability?: boolean;
  saldo?: boolean;
  sensaldo?: boolean;
  swener?: boolean;
  syntax?: boolean;
  wsd?: boolean;
};

const FORMATS: Record<FileFormat, string> = {
  txt: "text_import:parse",
  xml: "xml_import:parse",
  odt: "odt_import:parse",
  docx: "docx_import:parse",
  pdf: "pdf_import:parse",
};

export const FORMATS_EXT = Object.keys(FORMATS);

export const SEGMENTERS: ConfigSentenceSegmenter[] = ["linebreaks"];

export function makeConfig(id: string, options: ConfigOptions): string {
  const {
    format,
    language,
    name,
    description,
    textAnnotation,
    sentenceSegmenter,
    annotations,
  } = options;

  if (!format) {
    throw new TypeError("File format must be set.");
  }

  const config: SparvConfig = {
    metadata: {
      id,
      language,
      name,
      description,
    },
    import: {
      importer: FORMATS[format],
    },
    segment: sentenceSegmenter ? { sentence_segmenter: sentenceSegmenter } : {},
    export: {},
  };

  // Format-dependent settings
  if (format == "xml") {
    // The text annotation setting is required if XML, but it may be set later
    if (textAnnotation) {
      config.import.text_annotation = textAnnotation;
      config.export.source_annotations = [`${textAnnotation} as text`, "..."];
    }
  } else if (format == "pdf") {
    config.export.source_annotations = ["text", "page:number"];
  }

  // Annotations - use registry to get Sparv modules
  config.export.annotations = getSparvModules(annotations);

  if (annotations.datetime) {
    // Add annotations on the text level with custom values
    config.custom_annotations = [
      {
        annotator: "misc:constant",
        params: {
          out: "<text>:misc.datefrom",
          chunk: "<text>",
          value: annotations.datetime.from,
        },
      },
      {
        annotator: "misc:constant",
        params: {
          out: "<text>:misc.dateto",
          chunk: "<text>",
          value: annotations.datetime.to,
        },
      },
    ];

    // Enable annotations from the `dateformat` module
    config.export.annotations.push(
      "<text>:dateformat.datefrom",
      "<text>:dateformat.dateto",
      "<text>:dateformat.timefrom",
      "<text>:dateformat.timeto",
    );

    // Configure the annotators to use the custom attributes
    config.dateformat = {
      datetime_from: "<text>:misc.datefrom",
      datetime_to: "<text>:misc.dateto",
      datetime_informat: "%Y-%m-%d",
    };
  }

  return Yaml.dump(config as SparvConfig, { noArrayIndent: true });
}

/** Default values */
export function emptyConfig(): ConfigOptions {
  return {
    name: { swe: "", eng: "" },
    description: { swe: "", eng: "" },
    format: "txt",
    language: "fin",
    annotations: {
      datetime: undefined,
      lexicalClasses: true,
      readability: true,
      saldo: true,
      sensaldo: true,
      syntax: true,
      msd: true,
      swener: false,
      wsd: true,
    },
  };
}

/**
 * Parse a Sparv config YAML string.
 *
 * This is designed to reinflate a yaml written by `makeConfig()`.
 * When parsing a hand-written yaml, the result may be incomplete or excessive.
 *
 * May throw all kinds of errors, the sky is the limit (:
 */
export function parseConfig(configYaml: string): ConfigOptions {
  const config = Yaml.load(configYaml) as unknown as Partial<SparvConfig>;

  if (!config)
    throw new TypeError(`Parsing config failed, returned "${config}"`);

  // Throw specific errors if required parts are missing.
  if (!config.import?.importer) throw new TypeError(`Importer setting missing`);
  const format = (Object.keys(FORMATS) as FileFormat[]).find(
    (ext) => FORMATS[ext as FileFormat] == config.import?.importer,
  );
  if (!format)
    throw new TypeError(`Unrecognized importer: "${config.import.importer}"`);

  // Extract metadata
  const name = config.metadata?.name;
  if (!name)
    throw new TypeError(`Name missing in metadata: ${config.metadata}`);
  if (!name.swe || !name.eng)
    throw new TypeError(`Name must contain swe and eng: ${name}`);

  // Build options object
  const options = {
    ...emptyConfig(),
    format,
    language: config.metadata?.language || "swe", // Default to Swedish if not specified
    name,
    description: config.metadata?.description,
    textAnnotation: config.import.text_annotation,
    sentenceSegmenter: config.segment?.sentence_segmenter,
  };

  // Parse annotations from export modules using registry
  const parsedAnnotations = parseAnnotations(config.export?.annotations);
  options.annotations = {
    ...options.annotations,
    ...parsedAnnotations,
  };

  // Handle datetime annotation (special case)
  const datetimeFrom = config.custom_annotations?.find(
    (a) => a.params?.out == "<text>:misc.datefrom",
  )?.params?.value;
  const datetimeTo = config.custom_annotations?.find(
    (a) => a.params?.out == "<text>:misc.dateto",
  )?.params?.value;
  if (
    datetimeFrom &&
    typeof datetimeFrom == "string" &&
    datetimeTo &&
    typeof datetimeTo == "string"
  )
    options.annotations.datetime = { from: datetimeFrom, to: datetimeTo };

  return options;
}

/** Check if the config looks ready to run. May throw anything. */
export function validateConfig(config: ConfigOptions) {
  if (!config.format) {
    throw new TypeError("Format missing");
  }

  if (config.format == "xml" && !config.textAnnotation) {
    throw new TypeError("Text annotation setting is required for XML");
  }
}
