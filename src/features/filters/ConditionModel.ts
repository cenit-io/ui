export const ConditionOperatorLabels: Record<string, string> = {
  like: "Contains",
  is: "Is exactly",
  starts_with: "Starts with",
  ends_with: "Ends with",
  _not_null: "Is present",
  _null: "Is blank",
  _change: "Changes",
  _presence_change: "Present & Changes",
  between: "Is between",
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This week",
  last_week: "Last week",
  $eq: "Equal",
  $ne: "Not equal",
  $gt: "Greater than",
  $gte: "Greater than or equal",
  $lt: "Less than",
  $lte: "Less than or equal",
  $in: "Is in",
  $nin: "Is not in",
  $exists: "Exists",
  $regex: "Is like",
};

export const DefaultConditionOperations = ["_not_null", "_null", "_change", "_presence_change"];

export function conditionLabel(key: string) {
  return ConditionOperatorLabels[key] || key;
}
