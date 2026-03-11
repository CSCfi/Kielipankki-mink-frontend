<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { FormKit } from "@formkit/vue";
import { PhLightbulbFilament } from "@phosphor-icons/vue";
import PageTitle from "@/components/PageTitle.vue";
import LayoutSection from "@/components/LayoutSection.vue";
import useSpin from "@/spin/spin.composable";
import PendingContent from "@/spin/PendingContent.vue";
import { FORMATS_EXT, type FileFormat } from "@/api/corpusConfig";
import type { SparvLanguage } from "@/api/annotationMetadata";
import { useAuth } from "@/auth/auth.composable";
import useCreateCorpus from "@/corpus/createCorpus.composable";
import useMinkBackend from "@/api/backend.composable";
import HelpBox from "@/components/HelpBox.vue";
import FormKitWrapper from "@/components/FormKitWrapper.vue";

const { requireAuthentication } = useAuth();
const { createFromConfig } = useCreateCorpus();
const { loadLanguages } = useMinkBackend();
const { t } = useI18n();
const { spin } = useSpin();

type Form = {
  name: string;
  description: string;
  language: string;
  format: FileFormat;
  textAnnotation: string;
};

const formatOptions = computed(() =>
  FORMATS_EXT.reduce(
    (options, ext) => ({
      ...options,
      [ext]: `${t(ext)} (.${ext})`,
    }),
    {},
  ),
);

// Language selection
const availableLanguages = ref<SparvLanguage[]>([
  { name: "Finnish", code: "fin", annotators: {} },
]); // Default fallback

const languageOptions = computed(() =>
  availableLanguages.value.reduce(
    (options, lang) => ({
      ...options,
      [lang.code]: lang.name,
    }),
    {},
  ),
);

requireAuthentication();

// Load available languages (with annotator info) on mount
onMounted(async () => {
  try {
    const languages = await loadLanguages();
    if (languages && languages.length > 0) {
      availableLanguages.value = languages;
    }
  } catch (error) {
    console.error("Failed to load available languages:", error);
    // Keep default Swedish
  }
});

async function submit(fields: Form) {
  const selectedLang = availableLanguages.value.find(
    (l) => l.code === fields.language,
  );
  const availableModules = selectedLang?.annotators
    ? Object.keys(selectedLang.annotators)
    : undefined;

  const createPromise = createFromConfig(
    fields.name,
    fields.description,
    fields.language,
    fields.format,
    fields.textAnnotation,
    availableModules,
  );
  await spin(createPromise, "create");
}
</script>

<template>
  <PageTitle>{{ $t("new_corpus") }}</PageTitle>
  <LayoutSection>
    <HelpBox>{{ $t("corpus.create.help") }}</HelpBox>

    <PendingContent on="create">
      <FormKitWrapper>
        <FormKit
          id="create-corpus"
          v-slot="{ value }"
          type="form"
          :submit-label="$t('create')"
          :submit-attrs="{
            inputClass: 'mink-button button-primary',
          }"
          @submit="submit"
        >
          <FormKit
            :label="$t('name')"
            type="text"
            validation="required:trim"
            name="name"
            input-class="w-72"
            :help="$t('metadata.name.help')"
          />

          <FormKit
            :label="$t('description')"
            type="textarea"
            name="description"
            :help="$t('metadata.description.help')"
            input-class="block w-full h-20"
          />

          <FormKit
            name="language"
            :label="$t('corpus.language')"
            type="select"
            input-class="w-72"
            :help="$t('corpus.language.help')"
            :options="languageOptions"
            value="fin"
            validate="required"
          />

          <FormKit
            name="format"
            :label="$t('fileFormat')"
            type="select"
            input-class="w-72"
            :help="$t('config.format.help')"
            :options="formatOptions"
            validate="required"
          />

          <HelpBox v-if="value!.format === 'pdf'" important>
            <PhLightbulbFilament weight="bold" class="inline mb-1 mr-1" />
            {{ $t("config.format.note.pdf") }}
          </HelpBox>

          <FormKit
            v-if="value!.format === 'xml'"
            name="textAnnotation"
            :label="$t('config.text_annotation')"
            validation="required:trim|matches:/^[^<>\s]*$/"
            input-class="w-40 font-mono"
            :help="$t('config.text_annotation.help')"
          >
            <template #prefix>&lt;</template>
            <template #suffix>&gt;</template>
          </FormKit>
        </FormKit>
      </FormKitWrapper>
    </PendingContent>
  </LayoutSection>
</template>
