<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import useExports from "@/corpus/exports/exports.composable";
import ToolPanel from "@/corpus/explore/ToolPanel.vue";
import { ensureTrailingSlash } from "@/util";
import useCorpusIdParam from "@/corpus/corpusIdParam.composable";
import useJob from "@/corpus/job/job.composable";
import PendingContent from "@/spin/PendingContent.vue";
import useLocale from "@/i18n/locale.composable";
import useSpin from "@/spin/spin.composable";
import { useAuth } from "@/auth/auth.composable";
import useMessenger from "@/message/messenger.composable";

const corpusId = useCorpusIdParam();
const { isPending } = useSpin();
const { exports } = useExports(corpusId);
const { installKorp, isJobRunning, jobState } = useJob(corpusId);
const { locale3 } = useLocale();
const { refreshJwt, isAuthenticated, requireAuthentication } = useAuth();
const { alert } = useMessenger();
const { t } = useI18n();

const korpUrl = ensureTrailingSlash(import.meta.env.VITE_KORP_URL);

const korpShowUrl = computed(
  () => `${korpUrl}?mode=mink#?corpus=${corpusId}&lang=${locale3.value}`,
);

const canInstall = computed(
  () =>
    !isJobRunning.value &&
    exports.value?.length > 0 &&
    !isPending(`corpus/${corpusId}/job`),
);

async function korpInstall() {
  await installKorp();
}

/**
 * Open an external tool, but first re-check that the user is still logged in.
 *
 * The SB Auth session is short-lived, so by the time the user clicks here their
 * credentials may have expired. Handing off in that state lands them on an
 * unhelpful "no permission" page in the tool, so we refresh the JWT first and
 * only proceed if it's still valid.
 */
async function viewInTool(url: string) {
  // Open the tab synchronously, within the user gesture, to avoid the popup
  // blocker that would otherwise reject a window.open() after `await`.
  const toolWindow = window.open("", "_blank");
  await refreshJwt();
  if (!isAuthenticated.value) {
    toolWindow?.close();
    alert(t("exports.tools.session_expired"), "error");
    // Send the user to sign in again.
    requireAuthentication();
    return;
  }
  // Still logged in: hand off to the tool.
  if (toolWindow) {
    toolWindow.location.href = url;
  } else {
    // The pre-opened tab was blocked; try once more (may also be blocked).
    window.open(url, "_blank");
  }
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
        @install="korpInstall()"
        @view="viewInTool(korpShowUrl)"
      />
    </PendingContent>
  </div>
</template>
