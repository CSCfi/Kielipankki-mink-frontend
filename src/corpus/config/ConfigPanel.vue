<!-- Read-only summary panel displaying a corpus's current configuration. Shows
     metadata (name, description, corpus ID) and analysis settings (language,
     file format, text annotation, sentence segmenter, timespan, annotations)
     in a table. Used to give the user an overview of their configuration
     without editing it. -->
<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import useLocale from "@/i18n/locale.composable";
import useConfig from "@/corpus/config/config.composable";
import useCorpusIdParam from "@/corpus/corpusIdParam.composable";
import useMinkBackend from "@/api/backend.composable";
import { ANNOTATION_REGISTRY } from "@/api/annotationMetadata";
import PendingContent from "@/spin/PendingContent.vue";
import TerminalOutput from "@/components/TerminalOutput.vue";

const corpusId = useCorpusIdParam();
const { configOptions } = useConfig(corpusId);
const { loadLanguages } = useMinkBackend();
const { th } = useLocale();
const { t } = useI18n();

const availableLanguages = ref<Array<{ name: string; code: string }>>([]);

// Load available languages on mount
onMounted(async () => {
  try {
    const languages = await loadLanguages();
    if (languages && languages.length > 0) {
      availableLanguages.value = languages;
    }
  } catch (error) {
    console.error("Failed to load available languages:", error);
  }
});

const annotationsSummary = computed(() => {
  const annotations = configOptions.value?.annotations || {};
  const selected: string[] = [];

  // Use annotation registry to check for enabled annotations
  for (const annotation of ANNOTATION_REGISTRY) {
    if ((annotations as any)[annotation.id]) {
      selected.push(annotation.labelKey.replace("annotations.", ""));
    }
  }

  if (!selected.length) return "—";
  return selected.map((key) => t(`annotations.${key}`)).join(", ");
});

const languageDisplay = computed(() => {
  const langCode = configOptions.value?.language;
  if (!langCode) return "—";

  const lang = availableLanguages.value.find(l => l.code === langCode);
  return lang ? lang.name : langCode.toUpperCase();
});
</script>

<template>
  <PendingContent :on="`corpus/${corpusId}/config`">
    <table class="w-full">
      <td colspan="2">
        <h3 class="text-lg uppercase mb-2">{{ $t("metadata") }}</h3>
      </td>
      <tr>
        <th>{{ $t("name") }}</th>
        <td>
          {{ th(configOptions?.name) || "—" }}
        </td>
      </tr>
      <tr>
        <th>{{ $t("description") }}</th>
        <td>
          {{ th(configOptions?.description) || "—" }}
        </td>
      </tr>
      <tr>
        <th>{{ $t("identifier") }}</th>
        <td>
          <TerminalOutput class="inline leading-loose">
            {{ corpusId }}
          </TerminalOutput>
        </td>
      </tr>

      <tr>
        <td colspan="2">
          <h3 class="text-lg uppercase my-2">{{ $t("analysis") }}</h3>
        </td>
      </tr>
      <tr>
        <th>{{ $t("corpus.language") }}</th>
        <td>{{ languageDisplay }}</td>
      </tr>
      <tr>
        <th>{{ $t("fileFormat") }}</th>
        <td v-if="configOptions?.format">
          {{ $t(configOptions.format) }}
          (<code>.{{ configOptions.format }}</code
          >)
        </td>
        <td v-else>—</td>
      </tr>
      <tr v-if="configOptions?.textAnnotation">
        <th>{{ $t("config.text_annotation") }}</th>
        <td>
          <TerminalOutput class="inline leading-loose"
            >&lt;{{ configOptions.textAnnotation }}&gt;</TerminalOutput
          >
        </td>
      </tr>
      <tr v-if="configOptions?.format != 'xml'">
        <th>{{ $t("segmenter_sentence") }}</th>
        <td v-if="configOptions">
          {{
            configOptions.sentenceSegmenter
              ? $t(`segmenter_${configOptions.sentenceSegmenter}`)
              : $t("none")
          }}
        </td>
        <td v-else>—</td>
      </tr>
      <tr>
        <th>{{ $t("timespan") }}</th>
        <td v-if="configOptions?.annotations.datetime">
          <span class="whitespace-nowrap">{{
            configOptions.annotations.datetime.from
          }}</span>
          –
          <span class="whitespace-nowrap">{{
            configOptions.annotations.datetime.to
          }}</span>
        </td>
        <td v-else>—</td>
      </tr>
      <tr>
        <th>{{ $t("annotations") }}</th>
        <td v-if="configOptions">
          {{ annotationsSummary }}
        </td>
        <td v-else>—</td>
      </tr>
    </table>
  </PendingContent>
</template>
