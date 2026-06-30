import type {
  CurrentUserLabEventLogSummary,
  CurrentUserLabEventLogsResponse,
  CurrentUserLabRecordsResponse,
} from "../api/lab-records";
import type { LabEntrypoint, LabMetadata, LabVariant } from "../api/labs";

export function findVariantWebEntrypoint(
  lab: LabMetadata,
  variant: LabVariant,
): LabEntrypoint | undefined {
  return lab.entrypoints.web.find((entrypoint) => entrypoint.key === variant.entryKey);
}

export function filterLabRecordsForLab(
  records: CurrentUserLabRecordsResponse["records"],
  labKey: string,
): CurrentUserLabRecordsResponse["records"] {
  return {
    progress: records.progress.filter((item) => item.labKey === labKey),
    verifications: records.verifications.filter((item) => item.labKey === labKey),
  };
}

export function filterLabEventLogsForLab(
  events: CurrentUserLabEventLogsResponse["events"],
  labKey: string,
): CurrentUserLabEventLogsResponse["events"] {
  return events.filter((item) => item.labKey === labKey);
}

export function createLabEventRecapQuestions(
  event: CurrentUserLabEventLogSummary,
) {
  const questions = [
    "这条事件的后端决策是什么，为什么是这个决策？",
    "同样动作切换到另一个变体时，预期信号会如何变化？",
  ];

  if (event.phase === "attack") {
    questions.push("攻击者控制了哪个输入或动作？");
  } else if (event.phase === "defense") {
    questions.push("修复版依靠哪个校验或边界阻断？");
  } else {
    questions.push("正常业务路径需要保留哪些条件？");
  }

  if (event.decision === "accepted") {
    questions.push("系统为什么接受了请求？这是正常接受还是漏洞接受？");
  } else if (event.decision === "blocked") {
    questions.push("阻断发生在哪个边界？是否影响正常业务？");
  } else {
    questions.push("失败原因是输入无效、目标不存在，还是校验不通过？");
  }

  return questions;
}
