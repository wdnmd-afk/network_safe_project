export const labMetadataStatuses = [
  "planned",
  "in-progress",
  "ready",
  "deprecated",
];

export const labMetadataModes = ["interactive", "simulation", "case-study"];
export const labMetadataSeverities = ["low", "medium", "high", "critical"];
export const labMetadataDifficulties = [
  "beginner",
  "intermediate",
  "advanced",
];

export function parseLabMetadataJson(content) {
  try {
    return {
      ok: true,
      value: JSON.parse(content.replace(/^\uFEFF/, "")),
    };
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "invalid json"],
    };
  }
}

const requiredStringFields = [
  "id",
  "slug",
  "title",
  "category",
  "subcategory",
  "mode",
  "severity",
  "difficulty",
  "summary",
  "status",
];

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateStringField(metadata, field, errors) {
  if (!isNonEmptyString(metadata[field])) {
    errors.push(`${field} must be a non-empty string`);
  }
}

function validateEnumField(metadata, field, allowedValues, errors) {
  if (!allowedValues.includes(metadata[field])) {
    errors.push(`${field} must be one of: ${allowedValues.join(", ")}`);
  }
}

function validateStringArray(metadata, field, errors) {
  if (!Array.isArray(metadata[field])) {
    errors.push(`${field} must be an array`);
    return;
  }

  if (!metadata[field].every((item) => typeof item === "string")) {
    errors.push(`${field} must contain only strings`);
  }
}

function validatePaths(paths, errors) {
  const requiredPaths = ["root", "readme", "vuln", "fixed", "mock", "docs", "scripts"];

  if (!isRecord(paths)) {
    errors.push("paths must be an object");
    return;
  }

  for (const field of requiredPaths) {
    if (!isNonEmptyString(paths[field])) {
      errors.push(`paths.${field} must be a non-empty string`);
    }
  }
}

function validateVariants(variants, errors) {
  if (!Array.isArray(variants) || variants.length === 0) {
    errors.push("variants must be a non-empty array");
    return;
  }

  for (const [index, variant] of variants.entries()) {
    if (!isRecord(variant)) {
      errors.push(`variants[${index}] must be an object`);
      continue;
    }

    for (const field of [
      "key",
      "title",
      "description",
      "entryKey",
      "expectedOutcome",
    ]) {
      if (!isNonEmptyString(variant[field])) {
        errors.push(`variants[${index}].${field} must be a non-empty string`);
      }
    }

    if (typeof variant.enabled !== "boolean") {
      errors.push(`variants[${index}].enabled must be a boolean`);
    }

    if (typeof variant.supportsAutomation !== "boolean") {
      errors.push(`variants[${index}].supportsAutomation must be a boolean`);
    }
  }
}

function validateEntrypoints(entrypoints, errors) {
  if (!isRecord(entrypoints)) {
    errors.push("entrypoints must be an object");
    return;
  }

  for (const field of ["web", "api", "scripts", "docs"]) {
    if (!Array.isArray(entrypoints[field])) {
      errors.push(`entrypoints.${field} must be an array`);
    }
  }
}

function validateVerification(verification, errors) {
  if (!isRecord(verification)) {
    errors.push("verification must be an object");
    return;
  }

  if (!isRecord(verification.manual)) {
    errors.push("verification.manual must be an object");
  } else {
    if (typeof verification.manual.supported !== "boolean") {
      errors.push("verification.manual.supported must be a boolean");
    }

    if (!isNonEmptyString(verification.manual.stepsDocPath)) {
      errors.push("verification.manual.stepsDocPath must be a non-empty string");
    }

    if (!Array.isArray(verification.manual.expectedSignals)) {
      errors.push("verification.manual.expectedSignals must be an array");
    }
  }

  if (!isRecord(verification.automation)) {
    errors.push("verification.automation must be an object");
  } else if (typeof verification.automation.supported !== "boolean") {
    errors.push("verification.automation.supported must be a boolean");
  }
}

export function validateLabMetadata(value) {
  const errors = [];

  if (!isRecord(value)) {
    return {
      ok: false,
      errors: ["metadata must be an object"],
    };
  }

  for (const field of requiredStringFields) {
    validateStringField(value, field, errors);
  }

  validateEnumField(value, "status", labMetadataStatuses, errors);
  validateEnumField(value, "mode", labMetadataModes, errors);
  validateEnumField(value, "severity", labMetadataSeverities, errors);
  validateEnumField(value, "difficulty", labMetadataDifficulties, errors);
  validateStringArray(value, "tags", errors);
  validateStringArray(value, "knowledgePoints", errors);

  if (!Array.isArray(value.prerequisites)) {
    errors.push("prerequisites must be an array");
  }

  validateVariants(value.variants, errors);
  validateEntrypoints(value.entrypoints, errors);
  validateVerification(value.verification, errors);
  validatePaths(value.paths, errors);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value,
  };
}
