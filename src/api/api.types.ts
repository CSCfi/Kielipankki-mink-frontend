import type { AxiosProgressEvent } from "axios";
import type { ByLang } from "@/util.types";

/** Properties common to most backend responses */
export type MinkResponse<
  T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
  status: "success" | "error";
  return_code: string;
  message: string;
};

/** Data in the info response */
export type InfoData = {
  status_codes: InfoDataSection<{
    name: JobState;
    description: string;
  }>;
  importer_modules: InfoDataSection<{
    file_extension: `.${string}`;
    importer: string;
  }>;
  file_size_limits: InfoDataSection<{
    name: "max_content_length" | "max_file_length" | "max_corpus_length";
    description: string;
    value: number;
  }>;
  recommended_file_size: InfoDataSection<{
    name: "max_file_length" | "min_file_length";
    description: string;
    value: number;
  }>;
};

/** A structure for a section in the backend info response */
type InfoDataSection<T> = {
  info: string;
  data: T[];
};

/** Data in the list-corpora response */
export type ListCorporaData = {
  corpora: string[];
};

/** Data in the create-corpus response */
export type CreateCorpusData = {
  corpus_id: string;
};

/** Data in the create-metadata response */
export type CreateMetadataData = {
  resource_id: string;
};

/** Data in the resource-info response, if no corpus_id param is given */
export type ResourceInfoAllData = {
  resources: MinkResponse<ResourceInfo>[];
};

/** Data in the resource-info response, if the corpus_id param is given */
export type ResourceInfoOneData = ResourceInfo;

/** Data about a resource and its job status */
export type ResourceInfo = {
  owner?: UserData;
  resource: ResourceData;
  job: CorpusStatus;
};

/** Data about a Mink user */
export type UserData = {
  id: string;
  name: string;
  email: string;
  ui_language: string;
};

/** Basic data about a resource */
export type ResourceData = {
  type: ResourceType;
  id: string;
  public_id: string;
  name: ByLang;
  source_files: FileMeta[];
};

export type ResourceType = "corpus" | "metadata";

/** Job status for a resource */
// There's more but we're not using everything.
export type CorpusStatus = {
  current_process: JobType | null;
  status: JobStateMap;
  warnings: string;
  errors: string;
  sparv_output: string;
  installed_korp: boolean;
  installed_strix: boolean;
  /** ISO 8601 date */
  started: string | null;
  /** ISO 8601 date */
  last_run_started: string | "";
  /** ISO 8601 date */
  last_run_ended: string | "";
  /** Queue number, starting at 1 */
  priority: number | "";
  /** Percentage of job completion, if running */
  progress: `${number}%` | "";
};

export type JobStateMap = Record<JobType, JobState>;

/** File metadata */
export type FileMeta = {
  /** ISO 8601 date (with timezone offset) of last modification */
  last_modified: string;
  /** Filename */
  name: string;
  /** File path, relative to some directory */
  path: string;
  /** File size (bytes) */
  size: number;
  /** MIME type e.g. "text/xml" */
  type: string;
};

/** Indicates a job type that the backend can do */
export type JobType = "sparv" | "korp" | "strix" | "sync2storage";

/** The states a job can have */
export type JobState =
  | "none" // "Process does not exist"
  | "waiting" // "Waiting to be processed"
  | "running" // "Process is running"
  | "done" // "Process has finished"
  | "error" // "An error occurred in the process"
  | "aborted"; // "Process was aborted by the user"

/** Data in the list-exports response */
export type ListExportsData = {
  contents: FileMeta[];
};

/** Data in the admin-mode-status response */
export type AdminModeStatusData = {
  admin_mode_status: boolean;
};

export type ProgressHandler = (progressEvent: AxiosProgressEvent) => void;
