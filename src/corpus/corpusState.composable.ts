import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { validateConfig } from "@/api/corpusConfig";
import useConfig from "@/corpus/config/config.composable";
import useJob from "@/corpus/job/job.composable";
import useSources from "@/corpus/sources/sources.composable";
import { getException } from "@/util";

/** The "corpus state" is related to the job status, but is more about predicting what action the user needs to take. */
export function useCorpusState(corpusId: string) {
  const { sources } = useSources(corpusId);
  const { configOptions } = useConfig(corpusId);
  const { jobState } = useJob(corpusId);
  const { t } = useI18n();

  const corpusState = computed(() => {
    if (!sources.value.length) return CorpusState.EMPTY;
    if (!isConfigValid.value) return CorpusState.NEEDING_CONFIG;
    if (!hasMetadata.value) return CorpusState.NEEDING_META;

    if (!jobState.value) {
      console.warn(`Missing job state for ${corpusId}`);
      return CorpusState.UNKNOWN;
    }

    if (jobState.value.sparv == "none" || jobState.value.sparv == "aborted")
      return CorpusState.READY;
    if (jobState.value.sparv == "error") return CorpusState.FAILED;

    // TODO Revise the CorpusState concept. The workflow can now branch in two. Ifs below questionable.
    if (
      ["waiting", "running"].includes(jobState.value.korp) ||
      ["waiting", "running"].includes(jobState.value.strix)
    )
      return CorpusState.RUNNING_INSTALL;

    if (jobState.value.sparv == "waiting" || jobState.value.sparv == "running")
      return CorpusState.RUNNING;

    if (
      ["none", "aborted"].includes(jobState.value.korp) ||
      ["none", "aborted"].includes(jobState.value.strix)
    )
      return CorpusState.DONE;

    if (jobState.value.korp == "error" || jobState.value.strix == "error")
      return CorpusState.FAILED_INSTALL;

    if (jobState.value.korp == "done" || jobState.value.strix == "done")
      return CorpusState.DONE_INSTALL;

    console.warn("Invalid state", JSON.stringify(jobState.value));
    return CorpusState.UNKNOWN;
  });

  const isConfigValid = computed(
    () =>
      configOptions.value &&
      !getException(() => validateConfig(configOptions.value!)),
  );

  const hasMetadata = computed(
    () => configOptions.value?.name && Object.values(configOptions.value.name).some(Boolean),
  );

  const isEmpty = computed(() => corpusState.value == CorpusState.EMPTY);
  const isNeedingConfig = computed(
    () => corpusState.value == CorpusState.NEEDING_CONFIG,
  );
  const isNeedingMeta = computed(
    () => corpusState.value == CorpusState.NEEDING_META,
  );
  const canBeReady = computed(
    () => !isEmpty.value && !isNeedingConfig.value && !isNeedingMeta.value,
  );

  const isFailed = computed(
    () =>
      corpusState.value == CorpusState.FAILED ||
      corpusState.value == CorpusState.FAILED_INSTALL,
  );
  const isReady = computed(() => corpusState.value == CorpusState.READY);
  const isRunning = computed(() => corpusState.value == CorpusState.RUNNING);
  const isDone = computed(() => corpusState.value == CorpusState.DONE);
  const isRunningInstall = computed(
    () => corpusState.value == CorpusState.RUNNING_INSTALL,
  );
  const isDoneInstall = computed(
    () => corpusState.value == CorpusState.DONE_INSTALL,
  );

  const stateMessage = computed(() => t(`corpus.state.${corpusState.value}`));
  const stateHelp = computed(() => t(`corpus.state.help.${corpusState.value}`));
  const isActionNeeded = computed(
    () =>
      isEmpty.value ||
      isNeedingConfig.value ||
      isNeedingMeta.value ||
      isFailed.value,
  );

  return {
    corpusState,
    isEmpty,
    isNeedingConfig,
    isNeedingMeta,
    canBeReady,
    isFailed,
    isReady,
    isRunning,
    isDone,
    isRunningInstall,
    isDoneInstall,
    stateMessage,
    stateHelp,
    isActionNeeded,
  };
}

export class CorpusState {
  static get UNKNOWN() {
    return "unknown";
  }
  static get EMPTY() {
    return "empty";
  }
  static get NEEDING_CONFIG() {
    return "needing_config";
  }
  static get NEEDING_META() {
    return "needing_meta";
  }
  static get FAILED() {
    return "failed";
  }
  static get READY() {
    return "ready";
  }
  static get RUNNING() {
    return "running";
  }
  static get DONE() {
    return "done";
  }
  static get FAILED_INSTALL() {
    return "failed_install";
  }
  static get RUNNING_INSTALL() {
    return "running_install";
  }
  static get DONE_INSTALL() {
    return "done_install";
  }
}
