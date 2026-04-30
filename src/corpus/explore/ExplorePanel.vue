<script setup lang="ts">
import { computed } from "vue";
import useExports from "@/corpus/exports/exports.composable";
import ToolPanel from "@/corpus/explore/ToolPanel.vue";
import { ensureTrailingSlash } from "@/util";
import useCorpusIdParam from "@/corpus/corpusIdParam.composable";
import useJob from "@/corpus/job/job.composable";
import PendingContent from "@/spin/PendingContent.vue";
import useLocale from "@/i18n/locale.composable";
import useSpin from "@/spin/spin.composable";

const corpusId = useCorpusIdParam();
const { isPending } = useSpin();
const { exports } = useExports(corpusId);
const { installKorp, isJobRunning, jobState } = useJob(corpusId);
const { locale3 } = useLocale();

const korpUrl = ensureTrailingSlash(import.meta.env.VITE_KORP_URL);

const canInstall = computed(
  () =>
    !isJobRunning.value &&
    exports.value?.length > 0 &&
    !isPending(`corpus/${corpusId}/job`),
);

async function korpInstall() {
  await installKorp();
}
</script>

<template>
  <p>{{ $t("exports.tools.help") }}</p>
  <div class="mt-4">
    <PendingContent :on="`corpus/${corpusId}/job/install/korp`">
      <ToolPanel
        name="Korp"
        :info="$t('exports.tools.help.korp')"
        :link-url="$t('exports.tools.help.korp.manual.url')"
        :link-text="$t('exports.tools.help.korp.manual.text')"
        :can-install="canInstall"
        :is-installed="jobState?.korp == 'done'"
        :show-url="`${korpUrl}?mode=mink#?corpus=${corpusId}&lang=${locale3}`"
        @install="korpInstall()"
      />
    </PendingContent>
  </div>
</template>
