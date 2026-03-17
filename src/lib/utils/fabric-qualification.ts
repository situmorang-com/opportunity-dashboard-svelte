type FabricQualificationInput = {
  fabricWorkloads?: string[] | null;
  migrationSource?: string | null;
  capacityUnits?: number | null;
  authorityName?: string | null;
  championName?: string | null;
  timeline?: string | null;
  immediateNextStep?: string | null;
  competitor?: string | null;
  value?: number | null;
  leadSource?: string | null;
  coSellStatus?: string | null;
};

export type FabricQualificationResult = {
  score: number;
  band: "high" | "medium" | "low";
  reasons: string[];
};

function hasText(value: string | null | undefined) {
  return !!value && value.trim().length > 0;
}

export function calculateFabricQualificationScore(
  input: FabricQualificationInput,
): FabricQualificationResult {
  let score = 0;
  const reasons: string[] = [];

  const workloads = input.fabricWorkloads ?? [];
  if (workloads.length >= 3) {
    score += 20;
    reasons.push("Multi-workload Fabric scope identified");
  } else if (workloads.length > 0) {
    score += 10;
    reasons.push("Initial Fabric workload identified");
  }

  if (hasText(input.migrationSource) && input.migrationSource !== "Greenfield") {
    score += 10;
    reasons.push("Clear migration source defined");
  }

  if ((input.capacityUnits ?? 0) > 0) {
    score += 10;
    reasons.push("Capacity estimate captured");
  }

  if (hasText(input.championName)) {
    score += 15;
    reasons.push("Champion identified");
  }

  if (hasText(input.authorityName)) {
    score += 20;
    reasons.push("Decision maker identified");
  }

  if (hasText(input.timeline)) {
    score += 10;
    reasons.push("Timeline defined");
  }

  if (hasText(input.immediateNextStep)) {
    score += 10;
    reasons.push("Next step defined");
  }

  if ((input.value ?? 0) >= 100000) {
    score += 5;
    reasons.push("Material deal value");
  }

  if (hasText(input.coSellStatus) && !["Not Started", "Blocked"].includes(input.coSellStatus!)) {
    score += 10;
    reasons.push("Co-sell motion active");
  }

  if (hasText(input.competitor) && input.competitor !== "None") {
    score -= 5;
    reasons.push("Competitive pressure present");
  }

  score = Math.max(0, Math.min(100, score));
  const band = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  return {
    score,
    band,
    reasons: reasons.slice(0, 4),
  };
}
