import type { ByLang } from "@/util.types";

/** Models a Sparv config file */
export type SparvConfig = {
  metadata: ConfigMetadata;
  import: ConfigImport;
  segment: ConfigSegment;
  export: ConfigExport;
  dateformat?: ConfigDateformat;
  custom_annotations?: ConfigCustomAnnotation[];
  korp?: ConfigKorp;
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

type ConfigSegment = {
  sentence_segmenter?: ConfigSentenceSegmenter;
};

export type ConfigSentenceSegmenter = "linebreaks";

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

