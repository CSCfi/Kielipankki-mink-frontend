<script setup lang="ts">
import type { FormKitOptionsList } from "@formkit/inputs";
import type { AxiosError } from "axios";
import { computed, ref, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { FormKit } from "@formkit/vue";
import { PhLightbulbFilament, PhTrash } from "@phosphor-icons/vue";
import type { MinkResponse } from "@/api/api.types";
import {
  type ConfigOptions,
  FORMATS_EXT,
  type FileFormat,
  SEGMENTERS,
  emptyConfig,
  parseConfig,
} from "@/api/corpusConfig";
import {
  ANNOTATION_REGISTRY,
  getAvailableAnnotations,
  type AnnotationMetadata,
} from "@/api/annotationMetadata";
import type { ConfigSentenceSegmenter } from "@/api/sparvConfig.types";
import HelpBox from "@/components/HelpBox.vue";
import LayoutSection from "@/components/LayoutSection.vue";
import FormKitWrapper from "@/components/FormKitWrapper.vue";
import useCorpusIdParam from "@/corpus/corpusIdParam.composable";
import RouteButton from "@/components/RouteButton.vue";
import useMessenger from "@/message/messenger.composable";
import PendingContent from "@/spin/PendingContent.vue";
import useSources from "@/corpus/sources/sources.composable";
import useConfig from "@/corpus/config/config.composable";
import useMinkBackend from "@/api/backend.composable";
import type { ByLang } from "@/util.types";
import LayoutBox from "@/components/LayoutBox.vue";
import TerminalOutput from "@/components/TerminalOutput.vue";

const router = useRouter();
const corpusId = useCorpusIdParam();
const { config, uploadConfig } = useConfig(corpusId);
const { alert, alertError } = useMessenger();
const { extensions } = useSources(corpusId);
const { loadLanguages } = useMinkBackend();
const { t } = useI18n();

type Form = {
  name: ByLang;
  description: ByLang;
  language: string;
  format: FileFormat;
  textAnnotation: string;
  sentenceSegmenter: ConfigSentenceSegmenter;
  datetimeFrom: string;
  datetimeTo: string;
  // Dynamic annotation fields based on ANNOTATION_REGISTRY
  [key: string]: any;
};

const configOptions = computed(getParsedConfig);

// Language selection
const availableLanguages = ref<Array<{ name: string; code: string }>>([
  { name: "Swedish", code: "swe" }
]); // Default fallback
const selectedLanguage = ref<string>("swe");

const languageOptions = computed<FormKitOptionsList>(() =>
  availableLanguages.value.map((lang) => ({
    value: lang.code,
    label: lang.name,
  })),
);

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

// Get annotations available for currently selected language
const availableAnnotations = computed((): AnnotationMetadata[] => {
  return getAvailableAnnotations(selectedLanguage.value);
});

// Check if annotation is supported for current language
function isAnnotationSupported(annotation: AnnotationMetadata): boolean {
  return annotation.supportedLanguages.includes(selectedLanguage.value);
}

// Get the display name for the currently selected language
const selectedLanguageName = computed(() => {
  const lang = availableLanguages.value.find(l => l.code === selectedLanguage.value);
  return lang ? lang.name : selectedLanguage.value.toUpperCase();
});

const formatOptions = computed<FormKitOptionsList>(() =>
  FORMATS_EXT.map((ext) => ({
    value: ext,
    label: `${t(ext)} (.${ext})`,
    // If there are source files, disable all formats not present there.
    attrs: {
      disabled: extensions.value.length > 0 && !extensions.value.includes(ext),
    },
  })),
);

// Auto-select the file format present among source files, if any.
const selectedFormat = computed<FileFormat | undefined>(() =>
  configOptions.value?.format &&
  (!extensions.value.length ||
    extensions.value.includes(configOptions.value?.format))
    ? configOptions.value?.format
    : undefined,
);

type SegmenterOptions = Record<ConfigSentenceSegmenter | "", string>;

const segmenterOptions = computed<SegmenterOptions>(() => {
  const options: Partial<SegmenterOptions> = { "": t("none") };
  for (const segmenter of SEGMENTERS) {
    options[segmenter] = t(`segmenter_${segmenter}`);
  }
  return options as SegmenterOptions;
});

function getParsedConfig() {
  if (!config.value) return undefined;
  try {
    const parsed = parseConfig(config.value);
    return parsed;
  } catch (error) {
    alert(t("corpus.config.parse.error"), "error");
    console.error(`Error parsing config for "${corpusId}":`, error);
  }
}

// Update selectedLanguage when config is loaded
watch(configOptions, (newConfig) => {
  if (newConfig?.language) {
    selectedLanguage.value = newConfig.language;
  }
}, { immediate: true });

async function submit(fields: Form) {
  // If there is no previous config file, start from a minimal one.
  const configOld = configOptions.value || emptyConfig();

  // Build annotations object dynamically from registry
  const annotations: any = {
    datetime:
      fields.datetimeFrom && fields.datetimeTo
        ? {
            from: fields.datetimeFrom,
            to: fields.datetimeTo,
          }
        : undefined,
  };

  // Add all annotation flags from registry
  for (const annotation of ANNOTATION_REGISTRY) {
    annotations[annotation.id] = fields[annotation.id] || false;
  }

  // Merge new form values with existing config.
  const configNew: ConfigOptions = {
    ...configOld,
    name: fields.name,
    description: fields.description,
    language: fields.language,
    format: fields.format,
    textAnnotation: fields.textAnnotation,
    sentenceSegmenter: fields.sentenceSegmenter,
    annotations,
  };

  try {
    await uploadConfig(configNew);
    router.push(`/library/corpus/${corpusId}`);
  } catch (e) {
    if (e instanceof TypeError) {
      // Error from config serialization
      alert(e.message, "error");
    } else alertError(e as AxiosError<MinkResponse>);
  }
}
</script>

<template>
  <PendingContent :on="`corpus/${corpusId}/config`">
    <!-- Using the key attribute to re-render whole form after fetching config -->
    <FormKitWrapper :key="config">
      <FormKit
        id="corpus-config"
        v-slot="{ value }"
        type="form"
        :submit-label="$t('save')"
        :submit-attrs="{
          inputClass: 'mink-button button-primary',
        }"
        @submit="submit"
      >
        <LayoutSection :title="$t('metadata')">
          <HelpBox>
            <p>{{ $t("config.metadata.help") }}</p>
          </HelpBox>

          <div class="grid md:grid-cols-2 gap-4">
            <LayoutBox
              v-for="(lang2, lang3) of { swe: 'sv', eng: 'en' }"
              :key="lang3"
              :title="$t(lang2)"
            >
              <FormKit type="group" name="name">
                <FormKit
                  :name="lang3"
                  :label="$t('name')"
                  :value="configOptions?.name?.[lang3]"
                  :help="$t('metadata.name.help')"
                  type="text"
                  input-class="w-72"
                  validation="required:trim"
                />
              </FormKit>

              <FormKit type="group" name="description">
                <FormKit
                  :name="lang3"
                  :label="$t('description')"
                  :value="configOptions?.description?.[lang3]"
                  :help="$t('metadata.description.help')"
                  type="textarea"
                  input-class="w-full h-20"
                />
              </FormKit>
            </LayoutBox>
          </div>

          <FormKit
            :label="$t('identifier')"
            type="text"
            name="identifier"
            disabled
            :value="corpusId"
            :help="$t('metadata.identifier.help')"
          >
            <template #label>
              <!-- Avoid orphaned <label> for better accessibility -->
              <span class="formkit-label">{{ $t("identifier") }}</span>
            </template>
            <template #input>
              <TerminalOutput class="inline leading-loose">
                {{ corpusId }}
              </TerminalOutput>
            </template>
          </FormKit>
        </LayoutSection>

        <LayoutSection :title="$t('configuration')">
          <HelpBox>
            <p>{{ $t("config.configuration.help") }}</p>
          </HelpBox>

          <FormKit
            name="language"
            :label="$t('corpus.language')"
            :value="configOptions?.language || 'swe'"
            type="select"
            input-class="w-72"
            :options="languageOptions"
            validation="required"
            :help="$t('corpus.language.help')"
            @input="(value) => selectedLanguage = value as string"
          />

          <FormKit
            name="format"
            :label="$t('fileFormat')"
            :value="selectedFormat"
            type="select"
            :placeholder="$t('select')"
            input-class="w-72"
            :options="formatOptions"
            validation="required"
            :help="$t('config.format.help')"
          />

          <HelpBox v-if="value!.format === 'pdf'" important>
            <PhLightbulbFilament weight="bold" class="inline mb-1 mr-1" />
            {{ $t("config.format.note.pdf") }}
          </HelpBox>

          <FormKit
            v-if="value!.format === 'xml'"
            name="textAnnotation"
            :label="$t('config.text_annotation')"
            type="text"
            :value="configOptions?.textAnnotation"
            validation="required:trim|matches:/^[^<>\s]*$/"
            input-class="w-40 font-mono"
            :help="$t('config.text_annotation.help')"
          >
            <template #prefix> &lt; </template>
            <template #suffix> &gt; </template>
          </FormKit>

          <FormKit
            name="sentenceSegmenter"
            :label="$t('segmenter_sentence')"
            :value="configOptions?.sentenceSegmenter || ''"
            type="radio"
            :options="segmenterOptions"
            :help="$t('segmenter_sentence_help')"
          />

          <FormKit
            name="datetimeFrom"
            type="date"
            :label="`${$t('timespan')}: ${$t('timespan_from')}`"
            :value="configOptions?.annotations.datetime?.from"
            :max="(value as Form).datetimeTo"
            validation="onlyif:datetimeTo"
            :validation-messages="{
              onlyif: $t('config.datetime.validate_both'),
            }"
          />
          <FormKit
            name="datetimeTo"
            type="date"
            :label="`${$t('timespan')}: ${$t('timespan_to')}`"
            :value="configOptions?.annotations.datetime?.to"
            :min="(value as Form).datetimeFrom"
            validation="onlyif:datetimeFrom"
            :validation-messages="{
              onlyif: $t('config.datetime.validate_both'),
            }"
            :help="$t('timespan_help')"
          />

          <LayoutSection :title="$t('annotations')">
            <div class="prose">
              <i18n-t tag="p" keypath="annotations.info" scope="global">
                <template #custom_config>
                  <router-link
                    :to="`/library/corpus/${corpusId}/config/custom`"
                  >
                    {{ $t("config.custom") }}
                  </router-link>
                </template>
              </i18n-t>
            </div>

            <!-- Dynamic annotation options based on selected language -->
            <div
              v-for="annotation in availableAnnotations"
              :key="annotation.id"
            >
              <FormKit
                :name="annotation.id"
                :label="$t(annotation.labelKey)"
                :value="(configOptions?.annotations as any)?.[annotation.id]"
                type="checkbox"
                :disabled="!isAnnotationSupported(annotation)"
                :help="$t(annotation.helpKey)"
              >
                <!-- Special template for SALDO with link -->
                <template v-if="annotation.id === 'saldo'" #help>
                  <i18n-t
                    tag="div"
                    keypath="annotations.saldo.help"
                    scope="global"
                    class="formkit-help"
                  >
                    <template #saldo>
                      <a :href="$t('annotations.saldo.saldo_url')" target="_blank"
                        >SALDO</a
                      >
                    </template>
                  </i18n-t>
                </template>
              </FormKit>

              <!-- Show warning if annotation not supported for current language -->
              <div
                v-if="!isAnnotationSupported(annotation)"
                class="text-amber-600 text-sm ml-6 -mt-2 mb-2"
              >
                {{ $t("corpus.annotation_not_available", { language: selectedLanguageName }) }}
              </div>
            </div>
          </LayoutSection>
        </LayoutSection>
      </FormKit>
    </FormKitWrapper>

    <div class="flex justify-center items-baseline gap-4">
      <RouteButton :to="`/library/corpus/${corpusId}/config/custom`">
        {{ $t("config.custom") }}
      </RouteButton>

      <RouteButton
        :to="`/library/corpus/${corpusId}/delete`"
        class="button-danger"
      >
        <PhTrash weight="fill" class="inline mb-1 mr-1" />
        {{ $t("corpus.delete") }}
      </RouteButton>
    </div>
  </PendingContent>
</template>
