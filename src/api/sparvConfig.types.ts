import type { ByLang } from "@/util.types";

/** Models a Sparv config file */
export type SparvConfig = {
  metadata: ConfigMetadata;
  classes?: ConfigClasses;
  import: ConfigImport;
  export: ConfigExport;
  dateformat?: ConfigDateformat;
  custom_annotations?: ConfigCustomAnnotation[];
  korp?: ConfigKorp;
};

/**
 * Sparv class bindings. When set, `token` and `sentence` are bound to a
 * language-appropriate tokenizer (e.g. Trankit) so that annotators reading or
 * writing `<token>`/`<sentence>` all agree on the same segmentation. Omitted
 * for languages with no dedicated tokenizer, which then use Sparv's default
 * `segment` module. See getTokenizerClasses in annotationMetadata.ts.
 */
type ConfigClasses = {
  token: string;
  sentence: string;
};

type ConfigKorp = {
  annotation_definitions?: Record<string, ConfigKorpAnnotationDefinition>;
};

type ConfigKorpAnnotationDefinition = {
  label?: Record<string, string>;
};

type ConfigMetadata = {
  id: string;
  language: string; // ISO 639-3 code (e.g., "swe", "fin", "eng")
  name: ByLang;
  description?: ByLang;
};

type ConfigImport = {
  importer: string;
  text_annotation?: string;
};

type ConfigExport = {
  annotations?: string[];
  source_annotations?: string[];
};

type ConfigDateformat = {
  datetime_from?: string;
  datetime_to?: string;
  datetime_informat?: string;
};

type ConfigCustomAnnotation = {
  annotator: string;
  params?: Record<string, unknown>;
};

