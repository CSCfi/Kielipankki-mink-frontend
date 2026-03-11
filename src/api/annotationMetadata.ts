import type { AnnotationOptions } from "./corpusConfig";

/** A single annotation output as returned by the backend */
export type SparvAnnotationInfo = {
  description: string;
  class?: string;
};

/** A single annotator module as returned by the backend */
export type SparvAnnotatorInfo = {
  description: string;
  annotations: Record<string, SparvAnnotationInfo>;
};

/** A language entry from GET /sparv-languages?annotators=true */
export type SparvLanguage = {
  name: string;
  code: string;
  annotators: Record<string, SparvAnnotatorInfo>;
};

/**
 * Metadata for a single annotation type
 */
export type AnnotationMetadata = {
  /** Unique identifier (matches AnnotationOptions key) */
  id: string;

  /** i18n key for annotation label */
  labelKey: string;

  /** i18n key for help text */
  helpKey: string;

  /**
   * The Sparv annotator module name as returned by /sparv-languages?annotators=true.
   * Used to determine availability dynamically from the backend.
   */
  sparvAnnotatorModule: string;

  /**
   * Fallback: languages that support this annotation (ISO 639-3 codes).
   * Used when dynamic annotator info is not available.
   */
  supportedLanguages: string[];

  /** Whether this annotation is enabled by default */
  defaultEnabled: boolean;

  /** Sparv export module strings to add when this annotation is enabled */
  sparvModules: string[];

  /** Optional: Additional dependencies (other annotations that must be enabled) */
  requires?: string[];
};

/**
 * Registry of all available annotations.
 * `sparvAnnotatorModule` must match the module key returned by the backend's
 * /sparv-languages?annotators=true endpoint.
 */
export const ANNOTATION_REGISTRY: AnnotationMetadata[] = [
  {
    id: "msd",
    labelKey: "annotations.msd",
    helpKey: "annotations.msd.help",
    sparvAnnotatorModule: "stanza",
    supportedLanguages: ["swe", "fin", "eng"],
    defaultEnabled: true,
    sparvModules: [
      "<token>:stanza.msd",
      "<token>:stanza.pos",
      "<token>:stanza.ufeats",
    ],
  },
  {
    id: "syntax",
    labelKey: "annotations.syntax",
    helpKey: "annotations.syntax.help",
    sparvAnnotatorModule: "stanza",
    supportedLanguages: ["swe", "fin", "eng"],
    defaultEnabled: true,
    sparvModules: [
      "<token>:stanza.dephead_ref as dephead",
      "<token>:stanza.deprel",
      "<token>:stanza.ref",
    ],
  },
  {
    id: "saldo",
    labelKey: "annotations.saldo",
    helpKey: "annotations.saldo.help",
    sparvAnnotatorModule: "saldo",
    supportedLanguages: ["swe"],
    defaultEnabled: true,
    sparvModules: [
      "<token>:saldo.baseform2 as lemma",
      "<token>:saldo.lemgram as lex",
      "<token>:saldo.compwf",
      "<token>:saldo.complemgram",
    ],
  },
  {
    id: "sensaldo",
    labelKey: "annotations.sensaldo",
    helpKey: "annotations.sensaldo.help",
    sparvAnnotatorModule: "sensaldo",
    supportedLanguages: ["swe"],
    defaultEnabled: true,
    sparvModules: [
      "<token>:sensaldo.sentiment_score",
      "<token>:sensaldo.sentiment_label",
    ],
  },
  {
    id: "swener",
    labelKey: "annotations.swener",
    helpKey: "annotations.swener.help",
    sparvAnnotatorModule: "swener",
    supportedLanguages: ["swe"],
    defaultEnabled: false,
    sparvModules: [
      "swener.ne",
      "swener.ne:swener.name",
      "swener.ne:swener.ex",
      "swener.ne:swener.type",
      "swener.ne:swener.subtype",
      "<sentence>:geo.geo_context as _geocontext",
    ],
  },
  {
    id: "lexicalClasses",
    labelKey: "annotations.lexical_classes",
    helpKey: "annotations.lexical_classes.help",
    sparvAnnotatorModule: "lexical_classes",
    supportedLanguages: ["swe"],
    defaultEnabled: true,
    sparvModules: [
      "<token>:lexical_classes.blingbring",
      "<token>:lexical_classes.swefn",
      "<text>:lexical_classes.blingbring",
      "<text>:lexical_classes.swefn",
    ],
  },
  {
    id: "readability",
    labelKey: "annotations.readability",
    helpKey: "annotations.readability.help",
    sparvAnnotatorModule: "readability",
    supportedLanguages: ["swe"],
    defaultEnabled: true,
    sparvModules: [
      "<text>:readability.lix",
      "<text>:readability.ovix",
      "<text>:readability.nk",
    ],
  },
  {
    id: "wsd",
    labelKey: "annotations.wsd",
    helpKey: "annotations.wsd.help",
    sparvAnnotatorModule: "wsd",
    supportedLanguages: ["swe"],
    defaultEnabled: true,
    sparvModules: ["<token>:wsd.sense"],
  },
];

/**
 * Core annotations that are always included regardless of user selection
 */
export const CORE_ANNOTATIONS = [
  "<token>:misc.tail as _tail",
  "<token>:misc.head as _head",
  "<sentence>:misc.id",
  "<text>:misc.source",
  "<text>:misc.id as _id",
];

/**
 * Get annotations available for a specific language.
 *
 * When `availableModules` is provided (from /sparv-languages?annotators=true),
 * it is used as the source of truth. Otherwise falls back to the static
 * `supportedLanguages` field in each registry entry.
 */
export function getAvailableAnnotations(
  language: string,
  availableModules?: string[],
): AnnotationMetadata[] {
  if (availableModules !== undefined) {
    return ANNOTATION_REGISTRY.filter((a) =>
      availableModules.includes(a.sparvAnnotatorModule),
    );
  }
  return ANNOTATION_REGISTRY.filter((a) =>
    a.supportedLanguages.includes(language),
  );
}

/**
 * Check if an annotation is available for a language.
 *
 * When `availableModules` is provided it takes precedence over `supportedLanguages`.
 */
export function isAnnotationAvailable(
  annotationId: string,
  language: string,
  availableModules?: string[],
): boolean {
  const annotation = ANNOTATION_REGISTRY.find((a) => a.id === annotationId);
  if (!annotation) return false;
  if (availableModules !== undefined) {
    return availableModules.includes(annotation.sparvAnnotatorModule);
  }
  return annotation.supportedLanguages.includes(language);
}

/**
 * Get default annotation options for a language.
 *
 * When `availableModules` is provided it is used to filter instead of
 * `supportedLanguages`.
 */
export function getDefaultAnnotations(
  language: string,
  availableModules?: string[],
): Partial<AnnotationOptions> {
  const available = getAvailableAnnotations(language, availableModules);
  const defaults: any = {};

  for (const annotation of available) {
    if (annotation.id !== "datetime") {
      // Special case
      defaults[annotation.id] = annotation.defaultEnabled;
    }
  }

  return defaults;
}

/**
 * Get Sparv modules for enabled annotations
 */
export function getSparvModules(annotations: AnnotationOptions): string[] {
  const modules: string[] = [...CORE_ANNOTATIONS];

  for (const annotation of ANNOTATION_REGISTRY) {
    const value = (annotations as any)[annotation.id];
    if (value === true) {
      // Enabled
      modules.push(...annotation.sparvModules);
    }
  }

  return modules;
}

/**
 * Parse annotations from Sparv export modules
 */
export function parseAnnotations(
  exportModules: string[] | undefined,
): Partial<AnnotationOptions> {
  if (!exportModules) return {};

  const annotations: any = {};

  for (const annotation of ANNOTATION_REGISTRY) {
    // Check if any of this annotation's Sparv modules are present
    const isEnabled = annotation.sparvModules.some((module) =>
      exportModules.includes(module),
    );
    annotations[annotation.id] = isEnabled;
  }

  return annotations;
}
