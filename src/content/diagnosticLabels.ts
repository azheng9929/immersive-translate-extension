export function diagnosticReasonLabel(reason: string): string {
  if (reason === "target-language") return "目标语言";
  if (reason === "global-selector" || reason === "site-selector") return "插件或站点界面";
  if (reason === "global-text" || reason === "site-text" || reason === "site-phrase") return "元数据或控件文本";
  if (reason === "not-meaningful") return "短文本";
  if (reason === "hidden") return "隐藏文本";
  if (reason === "empty") return "空文本";
  if (reason === "compiled-filter") return "命中规则排除";
  if (reason === "no-parent") return "无父元素";
  return reason.replaceAll("-", " ");
}
