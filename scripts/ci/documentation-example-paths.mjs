import path from 'node:path';

export function resolveContainedPath(baseDirectory, candidatePath) {
  if (!candidatePath || candidatePath.includes('\\')) {
    throw new Error(`Unsafe documentation example path: ${JSON.stringify(candidatePath)}.`);
  }

  const targetPath = path.resolve(baseDirectory, candidatePath);
  const relativePath = path.relative(baseDirectory, targetPath);

  if (
    relativePath === '' ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error(`Documentation example path escapes its fixture: ${JSON.stringify(candidatePath)}.`);
  }

  return targetPath;
}

export function resolveVirtualFilePath(baseDirectory, virtualPath) {
  if (!virtualPath.startsWith('/') || virtualPath.startsWith('//')) {
    throw new Error(`Invalid documentation virtual file path: ${JSON.stringify(virtualPath)}.`);
  }

  return resolveContainedPath(baseDirectory, virtualPath.slice(1));
}
