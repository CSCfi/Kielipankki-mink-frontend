import api from "@/api/api";
import useSpin from "@/spin/spin.composable";
import type { ProgressHandler } from "@/api/api.types";

/** Wraps API endpoints with Spin. */
export default function useMinkBackend() {
  const { spin } = useSpin();

  const loadCorpusIds = () => spin(api.listCorpora(), "corpora");

  const createCorpus = () => spin(api.createCorpus(), "create");

  const createMetadata = (publicId: string) =>
    spin(api.createMetadata(publicId), "create");

  const deleteCorpus = (corpusId: string) =>
    spin(api.removeCorpus(corpusId), `corpus/${corpusId}/delete`);

  const deleteMetadata = (resourceId: string) =>
    spin(api.removeMetadata(resourceId), `resource/${resourceId}/delete`);

  const loadConfig = (corpusId: string) =>
    spin(api.downloadConfig(corpusId), `corpus/${corpusId}/config`);

  const saveConfig = (corpusId: string, configYaml: string) =>
    spin(api.uploadConfig(corpusId, configYaml), `corpus/${corpusId}/config`);

  const downloadSource = (corpusId: string, filename: string, binary = false) =>
    spin(
      api.downloadSources(corpusId, filename, binary),
      `corpus/${corpusId}/sources/${filename}/raw`,
    );

  const downloadPlaintext = (corpusId: string, filename: string) =>
    spin(
      api.downloadSourceText(corpusId, filename),
      `corpus/${corpusId}/sources/${filename}/plain`,
    );

  const uploadSources = (
    corpusId: string,
    files: File[],
    onProgress?: ProgressHandler,
  ) =>
    spin(
      api.uploadSources(corpusId, files, onProgress),
      `corpus/${corpusId}/sources/upload`,
    );

  const deleteSource = (corpusId: string, filename: string) =>
    spin(
      api.removeSource(corpusId, filename),
      `corpus/${corpusId}/sources/list`,
    );

  // Same as `resourceInfoOne` but with another spin token.
  const listSources = (corpusId: string) =>
    spin(api.resourceInfoOne(corpusId), `corpus/${corpusId}/sources/list`);

  const uploadMetadata = (resourceId: string, yaml: string) =>
    spin(
      api.uploadMetadataYaml(resourceId, yaml),
      `resource/${resourceId}/metadata`,
    );

  const downloadMetadata = (resourceId: string) =>
    spin(
      api.downloadMetaataYaml(resourceId),
      `resource/${resourceId}/metadata`,
    );

  const resourceInfoAll = () => spin(api.resourceInfoAll(), "corpora");

  // Same as `listSources` but with another spin token.
  const resourceInfoOne = (corpusId: string) =>
    spin(api.resourceInfoOne(corpusId), `corpus/${corpusId}/info`);

  const runJob = (corpusId: string) =>
    spin(api.runSparv(corpusId), `corpus/${corpusId}/job/sparv`);

  const installKorp = (corpusId: string) =>
    spin(api.installKorp(corpusId), `corpus/${corpusId}/job/install/korp`);

  const installStrix = (corpusId: string) =>
    spin(api.installStrix(corpusId), `corpus/${corpusId}/job/install/strix`);

  const abortJob = (corpusId: string) =>
    spin(api.abortJob(corpusId), `corpus/${corpusId}/job/abort`);

  const loadExports = (corpusId: string) =>
    spin(api.listExports(corpusId), `corpus/${corpusId}/exports/list`);

  const downloadExports = (corpusId: string) =>
    spin(api.downloadExports(corpusId), `corpus/${corpusId}/exports/download`);

  const downloadExportFiles = (corpusId: string, filename: string) =>
    spin(
      api.downloadExportFile(corpusId, filename),
      `corpus/${corpusId}/exports/download`,
    );

  const checkAdminMode = () => spin(api.adminModeStatus(), "admin-mode");

  const enableAdminMode = () => spin(api.adminModeOn(), "admin-mode");

  const disableAdminMode = () => spin(api.adminModeOff(), "admin-mode");

  const loadLanguages = () => spin(api.getSparvLanguages(), "languages");

  const loadLanguageExports = (language: string) =>
    spin(api.getSparvExports(language), `languages/${language}/exports`);

  return {
    loadCorpusIds,
    createCorpus,
    createMetadata,
    deleteCorpus,
    deleteMetadata,
    loadConfig,
    saveConfig,
    downloadSource,
    downloadPlaintext,
    uploadSources,
    deleteSource,
    listSources,
    uploadMetadata,
    downloadMetadata,
    resourceInfoAll,
    resourceInfoOne,
    runJob,
    installKorp,
    installStrix,
    abortJob,
    loadExports,
    downloadExports,
    downloadExportFiles,
    checkAdminMode,
    enableAdminMode,
    disableAdminMode,
    loadLanguages,
    loadLanguageExports,
  };
}
