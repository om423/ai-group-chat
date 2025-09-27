import { ThreadsService } from "./threads";
import { SummaryService } from "./summaries";
import { DocAnalystService } from "./docAnalyst";

export const services = {
  threads: new ThreadsService(),
  summary: new SummaryService(),
  doc: new DocAnalystService()
};

