import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const javascriptExtensions = new Set(['.cjs', '.js', '.mjs']);

function walkFiles(directory, output = []) {
  if (!existsSync(directory)) {
    return output;
  }
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, output);
    } else if (entry.isFile()) {
      output.push(entryPath);
    }
  }
  return output;
}

export function measureCodeMonsterUiPackage(packageDirectory) {
  const distDirectory = join(packageDirectory, 'dist');
  const measurement = {
    cssFiles: 0,
    cssGzip: 0,
    cssRaw: 0,
    jsFiles: 0,
    jsGzip: 0,
    jsRaw: 0,
  };

  for (const filePath of walkFiles(distDirectory)) {
    const extension = extname(filePath);
    if (extension !== '.css' && !javascriptExtensions.has(extension)) {
      continue;
    }
    const contents = readFileSync(filePath);
    const gzip = gzipSync(contents).length;
    if (extension === '.css') {
      measurement.cssFiles += 1;
      measurement.cssRaw += statSync(filePath).size;
      measurement.cssGzip += gzip;
    } else {
      measurement.jsFiles += 1;
      measurement.jsRaw += statSync(filePath).size;
      measurement.jsGzip += gzip;
    }
  }

  return measurement;
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

export function validateCodeMonsterUiPackageBudget(packageContract, packageDirectory, budget) {
  const distDirectory = join(packageDirectory, 'dist');
  if (!existsSync(distDirectory)) {
    return {
      errors: [`${packageContract.name} dist directory is missing; run the build before size checks.`],
      measurement: null,
    };
  }

  const measurement = measureCodeMonsterUiPackage(packageDirectory);
  const errors = [];
  for (const [field, limit] of Object.entries(budget)) {
    if (measurement[field] > limit) {
      errors.push(
        `${packageContract.name} ${field} budget exceeded: ${formatKiB(measurement[field])} > ${formatKiB(limit)}.`,
      );
    }
  }
  return { errors, measurement };
}

export function formatCodeMonsterUiPackageMeasurement(packageContract, packageDirectory, measurement) {
  return `${packageContract.name} (${relative(packageDirectory, join(packageDirectory, 'dist'))}): CSS ${formatKiB(measurement.cssRaw)} raw/${formatKiB(measurement.cssGzip)} gzip; JS ${formatKiB(measurement.jsRaw)} raw/${formatKiB(measurement.jsGzip)} gzip`;
}
