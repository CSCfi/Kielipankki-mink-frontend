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
  // --- Trankit (multilingual: swe, fin, eng) ---
  {
    id: "msd",
    labelKey: "annotations.msd",
    helpKey: "annotations.msd.help",
    sparvAnnotatorModule: "trankit",
    supportedLanguages: ["swe", "fin", "eng"],
    defaultEnabled: true,
    sparvModules: [
      "<token>:trankit.upos as upos",
      "<token>:trankit.baseform as baseform",
      "<token>:trankit.ufeats as ufeats",
    ],
  },
  {
    id: "syntax",
    labelKey: "annotations.syntax",
    helpKey: "annotations.syntax.help",
    sparvAnnotatorModule: "trankit",
    supportedLanguages: ["swe", "fin", "eng"],
    defaultEnabled: true,
    sparvModules: [
      "<token>:trankit.ref as ref",
      "<token>:trankit.dephead_ref as dephead",
      "<token>:trankit.deprel as deprel",
    ],
  },
  {
    id: "ner",
    labelKey: "annotations.ner",
    helpKey: "annotations.ner.help",
    sparvAnnotatorModule: "trankit",
    supportedLanguages: ["eng"],
    defaultEnabled: false,
    // Token-level NER (positional), matching the Kielipankki Korp word-attribute
    // convention — not a structural span. `ne_type` is the bare entity type and
    // `ne_part` the BIOES position prefix (span boundaries). See annotate_ner.
    sparvModules: [
      "<token>:trankit.ne_type as ne_type",
      "<token>:trankit.ne_part as ne_part",
    ],
  },
  // --- TreeTagger (many languages, POS + lemma only) ---
  {
    id: "treetagger",
    labelKey: "annotations.treetagger",
    helpKey: "annotations.treetagger.help",
    sparvAnnotatorModule: "treetagger",
    supportedLanguages: [
      "bul", "nld", "eng", "est", "fin", "fra", "deu",
      "ita", "lat", "pol", "rus", "spa",
    ],
    defaultEnabled: true,
    sparvModules: [
      "<token>:treetagger.upos as upos",
      "<token>:treetagger.pos as tt_morph",
      "<token>:treetagger.baseform",
    ],
  },
  // --- Swedish-specific modules (shown when server enables them) ---
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
 * Both gates apply: `supportedLanguages` is a hard cap (the languages we know
 * have working models), and when `availableModules` is provided (from
 * /sparv-languages?annotators=true) it additionally requires the Sparv
 * annotator module to actually be installed on the backend. This prevents
 * features like Trankit NER — which only has a model for English — from
 * appearing under Swedish/Finnish just because the Trankit module itself
 * supports those languages.
 */
export function getAvailableAnnotations(
  language: string,
  availableModules?: string[],
): AnnotationMetadata[] {
  return ANNOTATION_REGISTRY.filter((a) =>
    isAnnotationAvailableFor(a, language, availableModules),
  );
}

/**
 * Check if an annotation is available for a language.
 *
 * Both gates apply — see {@link getAvailableAnnotations}.
 */
export function isAnnotationAvailable(
  annotationId: string,
  language: string,
  availableModules?: string[],
): boolean {
  const annotation = ANNOTATION_REGISTRY.find((a) => a.id === annotationId);
  if (!annotation) return false;
  return isAnnotationAvailableFor(annotation, language, availableModules);
}

function isAnnotationAvailableFor(
  annotation: AnnotationMetadata,
  language: string,
  availableModules?: string[],
): boolean {
  if (!annotation.supportedLanguages.includes(language)) return false;
  if (
    availableModules !== undefined &&
    !availableModules.includes(annotation.sparvAnnotatorModule)
  ) {
    return false;
  }
  return true;
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
 * Get Sparv modules for enabled annotations.
 *
 * Trankit's `msd` and TreeTagger both export a UD POS tag and would otherwise
 * collide on the canonical `upos` export name (cwb-encode then rejects the
 * duplicate column). When both are enabled, Trankit keeps `upos` and
 * TreeTagger's UD POS is renamed to `tt_pos`.
 */
export function getSparvModules(annotations: AnnotationOptions): string[] {
  const modules: string[] = [...CORE_ANNOTATIONS];

  for (const annotation of ANNOTATION_REGISTRY) {
    const value = (annotations as any)[annotation.id];
    if (value === true) {
      modules.push(...annotation.sparvModules);
    }
  }

  if (hasUposCollision(annotations)) {
    const idx = modules.indexOf("<token>:treetagger.upos as upos");
    if (idx !== -1) {
      modules[idx] = "<token>:treetagger.upos as tt_pos";
    }
  }

  return modules;
}

/** True when both Trankit msd and TreeTagger are enabled and would collide on `upos`. */
function hasUposCollision(annotations: AnnotationOptions): boolean {
  return annotations.msd === true && annotations.treetagger === true;
}

/**
 * Tokenizers that own the `token`/`sentence` classes for the languages they
 * support. When a corpus's language is covered by one of these, the generated
 * config binds `<token>`/`<sentence>` to that tokenizer's segmentation so every
 * annotator agrees on it (see `makeConfig`). The covered languages are read
 * from the registry — a provider covers a language if any of its annotations
 * lists that language in `supportedLanguages` — so there is a single source of
 * truth: bringing a language online is a `supportedLanguages` edit here (plus
 * the matching `language=[...]` on the Sparv annotator).
 *
 * Languages not covered fall back to Sparv's default `segment` tokenizer, which
 * is fine for the TreeTagger-only languages: TreeTagger emits one tag per input
 * token, so it stays aligned with whatever produced the tokens.
 *
 * To add a new tokenizer (e.g. a future UDPipe module), add a row with the
 * annotation names it produces for the `token` and `sentence` classes.
 */
export const TOKENIZER_PROVIDERS: {
  module: string;
  classes: { token: string; sentence: string };
}[] = [
  {
    module: "trankit",
    classes: { token: "trankit.token", sentence: "trankit.sentence" },
  },
];

/**
 * Class bindings (`token`/`sentence`) for a language, or `undefined` to leave
 * Sparv's defaults (`segment.*`) in place.
 */
export function getTokenizerClasses(
  language: string,
): { token: string; sentence: string } | undefined {
  for (const provider of TOKENIZER_PROVIDERS) {
    const covers = ANNOTATION_REGISTRY.some(
      (a) =>
        a.sparvAnnotatorModule === provider.module &&
        a.supportedLanguages.includes(language),
    );
    if (covers) return provider.classes;
  }
  return undefined;
}

/**
 * The Sparv annotation that `<token>` resolves to for a language. Used to spell
 * out Korp `annotation_definitions` keys, which don't accept `<token>:`
 * shorthand (see below).
 */
export function getTokenAnnotation(language: string): string {
  return getTokenizerClasses(language)?.token ?? "segment.token";
}

/**
 * Korp `annotation_definitions` entries to emit alongside the export list.
 * Keyed by the resolved Sparv annotation name — class shorthand like
 * `<token>:` is explicitly unsupported here (see the `korp.annotation_definitions`
 * Config description in sparv/modules/korp/config.py), so the token class must
 * be spelled out. It is whatever the config binds `<token>` to for this
 * language (`trankit.token` for the trankit languages, `segment.token`
 * otherwise) — see `getTokenAnnotation`.
 * Used so that columns without a matching Korp preset get a proper,
 * translated label instead of the underscore-replacement fallback.
 */
type KorpAnnotationDefinition = {
  label: Record<string, string>;
  is_struct_attr?: boolean;
  extended_component?: string;
  dataset?: string[];
  translation?: Record<string, Record<string, string>>;
};

export function getKorpAnnotationDefinitions(
  annotations: AnnotationOptions,
  language: string,
): Record<string, KorpAnnotationDefinition> {
  const defs: Record<string, KorpAnnotationDefinition> = {};
  const token = getTokenAnnotation(language);

  if (annotations.treetagger === true) {
    defs[`${token}:treetagger.pos`] = {
      label: {
        eng: "TreeTagger morph",
        swe: "TreeTagger morfologi",
        fin: "TreeTagger morfologia",
      },
    };
    defs[`${token}:treetagger.baseform`] = {
      label: {
        eng: "TreeTagger baseform",
        swe: "TreeTagger grundform",
        fin: "TreeTagger perusmuoto",
      },
    };
    if (hasUposCollision(annotations)) {
      defs[`${token}:treetagger.upos`] = {
        label: {
          eng: "TreeTagger pos",
          swe: "TreeTagger ordklass",
          fin: "TreeTagger sanaluokka",
        },
      };
    }
  }

  if (annotations.ner === true) {
    // Trankit's English NER as two per-token attributes, resolved here to e.g.
    // `trankit.token:trankit.ne_type` / `:trankit.ne_part`, which Korp's config
    // exporter keys on. No `is_struct_attr` → they stay positional *word*
    // attributes (with it, Korp files them under structural/text). No
    // `translation` → Korp labels each datasetSelect value via
    // `locAttribute(translation, value, lang)`, which returns `undefined` when
    // `lang` isn't a key and crashes the value sort (`a[1].localeCompare`); the
    // UI lang code isn't reliable from here, so we show raw codes (always
    // defined). The deployed model is the CoNLL-2003 set (PER/ORG/LOC/MISC), not
    // OntoNotes-18 — datasets reflect that.
    defs[`${token}:trankit.ne_type`] = {
      label: {
        eng: "Named entity type",
        swe: "Namntyp",
        fin: "Nimen tyyppi",
      },
      extended_component: "datasetSelect",
      dataset: ["PER", "ORG", "LOC", "MISC"],
    };
    defs[`${token}:trankit.ne_part`] = {
      label: {
        eng: "Named entity part",
        swe: "Namndel",
        fin: "Nimen osa",
      },
      extended_component: "datasetSelect",
      dataset: ["B", "I", "E", "S"],
    };
  }

  return defs;
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
