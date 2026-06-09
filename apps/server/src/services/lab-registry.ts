import {
  parseLabMetadataJson,
  validateLabMetadata,
  type LabMetadata,
} from "@network-safe/shared/lab-metadata";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

type LabRegistryOptions = {
  labsRoot?: string;
};

type LabRegistry = {
  listLabs: () => Promise<LabMetadata[]>;
  getLab: (category: string, scene: string) => Promise<LabMetadata | undefined>;
};

const repoRoot = path.resolve(process.cwd(), "../..");
const defaultLabsRoot = path.resolve(repoRoot, "labs");

async function pathExistsAsDirectory(directoryPath: string) {
  try {
    const entries = await readdir(directoryPath, {
      withFileTypes: true,
    });
    return entries;
  } catch {
    return [];
  }
}

async function findMetaFiles(labsRoot: string) {
  const metaFiles: string[] = [];
  const categories = await pathExistsAsDirectory(labsRoot);

  for (const category of categories) {
    if (!category.isDirectory()) {
      continue;
    }

    const categoryPath = path.join(labsRoot, category.name);
    const scenes = await pathExistsAsDirectory(categoryPath);

    for (const scene of scenes) {
      if (!scene.isDirectory()) {
        continue;
      }

      metaFiles.push(path.join(categoryPath, scene.name, "meta.json"));
    }
  }

  return metaFiles;
}

async function readLabMetadata(filePath: string) {
  const content = await readFile(filePath, "utf8");
  const parsed = parseLabMetadataJson(content);

  if (!parsed.ok) {
    throw new Error(`${filePath}: ${parsed.errors.join("; ")}`);
  }

  const validation = validateLabMetadata(parsed.value);

  if (!validation.ok) {
    throw new Error(`${filePath}: ${validation.errors.join("; ")}`);
  }

  return validation.value;
}

function sortLabs(labs: LabMetadata[]) {
  return [...labs].sort((left, right) => {
    const leftKey = `${left.category}/${left.subcategory}`;
    const rightKey = `${right.category}/${right.subcategory}`;
    return leftKey.localeCompare(rightKey);
  });
}

export function createLabRegistry(options: LabRegistryOptions = {}): LabRegistry {
  const labsRoot = path.resolve(options.labsRoot ?? defaultLabsRoot);

  return {
    async listLabs() {
      const metaFiles = await findMetaFiles(labsRoot);
      const labs = await Promise.all(metaFiles.map((filePath) => readLabMetadata(filePath)));

      return sortLabs(labs);
    },

    async getLab(category: string, scene: string) {
      const labs = await this.listLabs();

      return labs.find(
        (lab) => lab.category === category && lab.subcategory === scene,
      );
    },
  };
}
