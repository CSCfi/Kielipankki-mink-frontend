import Axios, { type AxiosInstance } from "axios";
import { ensureTrailingSlash } from "@/util";
import type {
  MinkResponse,
  InfoData,
  ListCorporaData,
  CreateCorpusData,
  ResourceInfoAllData,
  ResourceInfoOneData,
  ListExportsData,
  AdminModeStatusData,
  CreateMetadataData,
  ProgressHandler,
  JobStateMap,
} from "@/api/api.types";

/** Create a `text/yaml` file object with content */
const yamlAsFile = (filename: string, yaml: string): File =>
  new File([yaml], filename, { type: "text/yaml" });

/** Create a form data object with one or more files under `"files[]"` */
function filesFormData(...files: File[]): FormData {
  const formData = new FormData();
  files.forEach((file) => formData.append("files[]", file));
  return formData;
}

/** Handle an exception from an API call that may be encoded as Blob */
async function rethrowBlobError(error: unknown): Promise<never> {
  if (Axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    // Parse JSON and replace the blob
    const text = await error.response.data.text();
    error.response.data = JSON.parse(text) as MinkResponse;
  }
  throw error;
}

/** Mink backend API client */
class MinkApi {
  /** An instance of the Axios HTTP client. */
  axios: AxiosInstance;

  /** A JWT token used to authenticate API requests. */
  jwt: string | undefined;

  /** Creates the client instance */
  constructor() {
    this.axios = Axios.create({
      baseURL: ensureTrailingSlash(import.meta.env.VITE_BACKEND_URL),
      withCredentials: true,
    });
  }

  /** Sets a JWT token which is then used to authenticate API requests. */
  setJwt(jwt?: string) {
    this.jwt = jwt;
    this.axios.defaults.headers["Authorization"] = jwt ? `Bearer ${jwt}` : null;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Documentation/operation/APIinfo */
  async getInfo() {
    const response = await this.axios.get<MinkResponse<InfoData>>("info");
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Corpora/operation/listcorpora */
  async listCorpora() {
    const response =
      await this.axios.get<MinkResponse<ListCorporaData>>("list-corpora");
    return response.data.corpora;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Corpora/operation/createcorpus */
  async createCorpus() {
    const response =
      await this.axios.post<MinkResponse<CreateCorpusData>>("create-corpus");
    return response.data.corpus_id;
  }

  async createMetadata(publicId: string) {
    const response = await this.axios.post<MinkResponse<CreateMetadataData>>(
      "create-metadata",
      undefined,
      { params: { public_id: publicId } },
    );
    return response.data.resource_id;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Corpora/operation/removecorpus */
  async removeCorpus(corpusId: string) {
    const response = await this.axios.delete<MinkResponse>("remove-corpus", {
      params: { corpus_id: corpusId },
    });
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Metadata/operation/removemetadata */
  async removeMetadata(resourceId: string) {
    const response = await this.axios.delete<MinkResponse>("remove-metadata", {
      params: { corpus_id: resourceId },
    });
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Config/operation/uploadconfig */
  async uploadConfig(corpusId: string, config: string) {
    const formData = filesFormData(yamlAsFile("config.yaml", config));
    const response = await this.axios.put<MinkResponse>(
      "upload-config",
      formData,
      { params: { corpus_id: corpusId } },
    );
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Sources/operation/downloadsources */
  async downloadSources<B extends boolean>(
    corpusId: string,
    filename: string,
    binary: B,
  ) {
    const response = await this.axios
      .get<B extends true ? Blob : string>("download-sources", {
        params: { corpus_id: corpusId, file: filename, zip: false },
        responseType: binary ? "blob" : "text",
      })
      .catch(rethrowBlobError);
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Exports/operation/downloadsourcetext */
  async downloadSourceText(corpusId: string, filename: string) {
    const response = await this.axios.get<string>("download-source-text", {
      params: { corpus_id: corpusId, file: filename },
    });
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Sources/operation/uploadsources */
  async uploadSources(
    corpusId: string,
    files: File[],
    onProgress?: ProgressHandler,
  ) {
    const formData = filesFormData(...files);
    const response = await this.axios.put<MinkResponse>(
      "upload-sources",
      formData,
      {
        params: { corpus_id: corpusId },
        onUploadProgress: onProgress,
      },
    );
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Sources/operation/removesources */
  async removeSource(corpusId: string, name: string) {
    const response = await this.axios.delete<MinkResponse>("remove-sources", {
      params: { corpus_id: corpusId, remove: name },
    });
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Config/operation/downloadconfig */
  async downloadConfig(corpusId: string) {
    const response = await this.axios.get<string>("download-config", {
      params: { corpus_id: corpusId },
    });
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Metadata/operation/uploadmetadatayaml */
  async uploadMetadataYaml(resourceId: string, yaml: string) {
    const formData = filesFormData(yamlAsFile("metadata.yaml", yaml));
    const response = await this.axios.put<MinkResponse>(
      "upload-metadata-yaml",
      formData,
      { params: { corpus_id: resourceId } },
    );
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Metadata/operation/downloadmetadatayaml */
  async downloadMetaataYaml(resourceId: string) {
    const response = await this.axios.get<string>("download-metadata-yaml", {
      params: { corpus_id: resourceId },
    });
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Process-Corpus/operation/resourceinfo */
  async resourceInfoAll() {
    const response =
      await this.axios.get<MinkResponse<ResourceInfoAllData>>("resource-info");
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Process-Corpus/operation/resourceinfo */
  async resourceInfoOne(corpusId: string) {
    const response = await this.axios.get<MinkResponse<ResourceInfoOneData>>(
      "resource-info",
      { params: { corpus_id: corpusId } },
    );
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Process-Corpus/operation/runSparv */
  async runSparv(corpusId: string) {
    const response = await this.axios
      .put<MinkResponse<ResourceInfoOneData>>("run-sparv", null, {
        params: { corpus_id: corpusId },
      })
      // Errors are okay.
      // TODO Use the `validateStatus` config option instead
      .catch((reason) => reason.response);
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Process-Corpus/operation/abortjob */
  async abortJob(corpusId: string) {
    const response = await this.axios.post<MinkResponse<JobStateMap>>(
      "abort-job",
      null,
      { params: { corpus_id: corpusId } },
    );
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Exports/operation/listexports */
  async listExports(corpusId: string) {
    const response = await this.axios.get<MinkResponse<ListExportsData>>(
      "list-exports",
      { params: { corpus_id: corpusId } },
    );
    return response.data.contents;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Exports/operation/downloadexports */
  async downloadExports(corpusId: string) {
    const response = await this.axios
      .get<Blob>("download-exports", {
        params: { corpus_id: corpusId },
        responseType: "blob",
      })
      .catch(rethrowBlobError);
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Manage-Exports/operation/downloadexports */
  async downloadExportFile(corpusId: string, path: string) {
    const response = await this.axios
      .get<Blob>("download-exports", {
        params: { corpus_id: corpusId, file: path, zip: false },
        responseType: "blob",
      })
      .catch(rethrowBlobError);
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Process-Corpus/operation/installinKorp */
  async installKorp(corpusId: string) {
    const response = await this.axios.put<MinkResponse<ResourceInfoOneData>>(
      "install-korp",
      null,
      { params: { corpus_id: corpusId } },
    );
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Process-Corpus/operation/installinStrix */
  async installStrix(corpusId: string) {
    const response = await this.axios.put<MinkResponse<ResourceInfoOneData>>(
      "install-strix",
      null,
      { params: { corpus_id: corpusId } },
    );
    return response.data;
  }

  /** Get available Sparv languages */
  async getSparvLanguages() {
    const response = await this.axios.get<
      MinkResponse<{ languages: string[] }>
    >("sparv-languages");
    return response.data.languages || ["swe"];
  }

  /** Get available exports for a specific language */
  async getSparvExports(language: string) {
    const response = await this.axios.get<MinkResponse<{ exports: string[] }>>(
      "sparv-exports",
      { params: { language } },
    );
    return response.data.exports || [];
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Admin-Mode/operation/adminmodestatus */
  async adminModeStatus() {
    const response =
      await this.axios.get<MinkResponse<AdminModeStatusData>>(
        "admin-mode-status",
      );
    return response.data.admin_mode_status;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Admin-Mode/operation/adminmodeon */
  async adminModeOn() {
    const response = await this.axios.post<MinkResponse>("admin-mode-on");
    return response.data;
  }

  /** @see https://ws.spraakbanken.gu.se/docs/mink#tag/Admin-Mode/operation/adminmodeoff */
  async adminModeOff() {
    const response = await this.axios.post<MinkResponse>("admin-mode-off");
    return response.data;
  }
}

/** API client singleton instance. */
export default new MinkApi();
