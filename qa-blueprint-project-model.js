(function(global){
  "use strict";

  const MANIFEST_PATH = "qa-project-manifest.json";
  const PROJECT_MAP_PATH = "docs/PROJECT_MAP.md";
  const CHANGELOG_PATH = "docs/CHANGELOG.md";

  function normalizePath(path){
    return String(path || "").replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
  }

  function isIgnoredInventoryPath(path){
    return /(^|\/)(node_modules|playwright-report|test-results)(\/|$)/.test(normalizePath(path));
  }

  function findManifestPath(zip){
    if(zip.file(MANIFEST_PATH)) return MANIFEST_PATH;
    const matches = Object.keys(zip.files)
      .filter((path) => !zip.files[path].dir)
      .map(normalizePath)
      .filter((path) => path.endsWith("/" + MANIFEST_PATH));
    return matches.length === 1 ? matches[0] : "";
  }

  function commonRootPrefix(paths){
    const meaningful = paths
      .map(normalizePath)
      .filter((path) => path && !isIgnoredInventoryPath(path));
    if(!meaningful.length) return "";
    const firstSegments = meaningful.map((path) => path.split("/")[0]).filter(Boolean);
    const first = firstSegments[0];
    if(!first || !firstSegments.every((segment) => segment === first)) return "";
    return first + "/";
  }

  function stripPrefix(path, prefix){
    path = normalizePath(path);
    prefix = normalizePath(prefix);
    return prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
  }

  function zipPath(project, path){
    return normalizePath((project && project.pathPrefix || "") + normalizePath(path));
  }

  function manifestEntry(path, metadata){
    const value = metadata || {};
    return {
      path:normalizePath(path),
      purpose:value.purpose || "Existing project file",
      owner:value.owner || "human",
      domain:value.domain || "infrastructure",
      exports:Array.isArray(value.exports) ? value.exports : [],
      relatedTestIds:Array.isArray(value.relatedTestIds) ? value.relatedTestIds : [],
      relatedPageObjects:Array.isArray(value.relatedPageObjects) ? value.relatedPageObjects : [],
      relatedApiServices:Array.isArray(value.relatedApiServices) ? value.relatedApiServices : [],
      lastUpdatedReason:value.lastUpdatedReason || "Discovered during project inventory",
      safeToOverwrite:value.safeToOverwrite === true
    };
  }

  function normalizeManifest(raw, paths){
    const parsed = raw && typeof raw === "object" ? raw : {};
    const entries = Array.isArray(parsed.files) ? parsed.files : Array.isArray(parsed.entries) ? parsed.entries : [];
    const byPath = new Map();
    entries.forEach((entry) => {
      if(entry && entry.path) byPath.set(normalizePath(entry.path), manifestEntry(entry.path, entry));
    });
    (paths || []).forEach((path) => {
      path = normalizePath(path);
      if(path && path !== MANIFEST_PATH && !byPath.has(path)) {
        byPath.set(path, manifestEntry(path, {
          owner:"human",
          safeToOverwrite:false,
          purpose:"Pre-existing file not previously registered; preserved conservatively",
          lastUpdatedReason:"Added to baseline manifest without changing file content"
        }));
      }
    });
    return {
      version:parsed.version || 1,
      projectName:parsed.projectName || "qa-blueprint-playwright-suite",
      generatedAt:parsed.generatedAt || new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      files:Array.from(byPath.values()).sort((a,b) => a.path.localeCompare(b.path))
    };
  }

  async function readExistingProject(file){
    if(!file) throw new Error("Choose an existing Playwright ZIP first.");
    if(!global.JSZip) throw new Error("JSZip is unavailable.");
    const zip = await global.JSZip.loadAsync(file);
    const rawPaths = Object.keys(zip.files).filter((path) => !zip.files[path].dir).map(normalizePath);
    const manifestPath = findManifestPath(zip);
    const pathPrefix = manifestPath
      ? manifestPath.slice(0, -MANIFEST_PATH.length)
      : commonRootPrefix(rawPaths);
    const paths = rawPaths
      .map((path) => stripPrefix(path, pathPrefix))
      .filter((path) => path && !isIgnoredInventoryPath(path));
    let manifestRaw = null;
    if(manifestPath && zip.file(manifestPath)) {
      try{ manifestRaw = JSON.parse(await zip.file(manifestPath).async("string")); }
      catch(error){ throw new Error("Existing qa-project-manifest.json is invalid: " + error.message); }
    }
    const manifest = normalizeManifest(manifestRaw, paths);
    return {zip, paths:new Set(paths), manifest, manifestWasMissing:!manifestRaw, fileName:file.name || "existing-project.zip", pathPrefix};
  }

  function entryMap(manifest){
    const map = new Map();
    (manifest && manifest.files || []).forEach((entry) => map.set(normalizePath(entry.path), entry));
    return map;
  }

  function managedBlocks(content){
    const blocks = new Map();
    const pattern = /\/\/ <qa-blueprint-managed id="([^"]+)">[\s\S]*?\/\/ <\/qa-blueprint-managed>/g;
    let match;
    while((match = pattern.exec(String(content || "")))) blocks.set(match[1], match[0]);
    return blocks;
  }

  function replaceManagedBlocks(existing, generated){
    const replacements = managedBlocks(generated);
    let output = String(existing || "");
    const replaced = [];
    replacements.forEach((block, id) => {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp("\\/\\/ <qa-blueprint-managed id=\\\"" + escaped + "\\\">[\\s\\S]*?\\/\\/ <\\/qa-blueprint-managed>");
      if(pattern.test(output)) {
        output = output.replace(pattern, block);
        replaced.push(id);
      }
    });
    return {content:output, changed:replaced.length > 0 && output !== existing, replaced};
  }

  function replaceMarkdownManagedBlock(existing, generated){
    const match = String(generated || "").match(/<!-- <qa-blueprint-managed id="project-map"> -->[\s\S]*?<!-- <\/qa-blueprint-managed> -->/);
    if(!match) return {content:existing, changed:false};
    const pattern = /<!-- <qa-blueprint-managed id="project-map"> -->[\s\S]*?<!-- <\/qa-blueprint-managed> -->/;
    if(!pattern.test(existing)) return {content:existing, changed:false};
    const content = existing.replace(pattern, match[0]);
    return {content, changed:content !== existing};
  }

  function appendChangelog(existing, entry){
    const text = String(existing || "# Changelog\n").replace(/\s+$/, "");
    if(text.includes(entry.marker)) return text + "\n";
    return text + "\n\n" + entry.content.trim() + "\n";
  }

  function mergeManifest(previous, template, changes, reason){
    const map = entryMap(previous);
    const templateMap = entryMap(template);
    (changes.created || []).concat(changes.modified || []).forEach((path) => {
      path = normalizePath(path);
      const candidate = templateMap.get(path) || map.get(path) || manifestEntry(path, {});
      map.set(path, manifestEntry(path, Object.assign({}, candidate, {lastUpdatedReason:reason})));
    });
    return {
      version:Math.max(previous.version || 1, template.version || 1),
      projectName:previous.projectName || template.projectName || "qa-blueprint-playwright-suite",
      generatedAt:previous.generatedAt || template.generatedAt || new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      files:Array.from(map.values()).sort((a,b) => a.path.localeCompare(b.path))
    };
  }

  async function createProject(files, manifest){
    const zip = new global.JSZip();
    Object.keys(files).forEach((path) => zip.file(normalizePath(path), files[path]));
    zip.file(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
    return {zip, changes:{created:Object.keys(files).concat(MANIFEST_PATH), modified:[], skipped:[]}, manifest};
  }

  async function maintainProject(existingProject, files, templateManifest, options){
    const zip = existingProject.zip;
    const previous = existingProject.manifest;
    const ownership = entryMap(previous);
    const changes = {created:[], modified:[], skipped:[]};
    const reason = options.requestSummary || "Applied blueprint maintenance update";

    for(const rawPath of Object.keys(files)) {
      const path = normalizePath(rawPath);
      if(path === MANIFEST_PATH || path === CHANGELOG_PATH) continue;
      const candidate = String(files[rawPath]);
      const currentFile = zip.file(zipPath(existingProject, path));
      if(!currentFile) {
        zip.file(zipPath(existingProject, path), candidate);
        changes.created.push(path);
        continue;
      }
      const entry = ownership.get(path);
      if(!entry) { changes.skipped.push({path, reason:"Existing unregistered file preserved"}); continue; }
      const current = await currentFile.async("string");
      if(entry.owner === "generated" && entry.safeToOverwrite === true) {
        if(current !== candidate) { zip.file(zipPath(existingProject, path), candidate); changes.modified.push(path); }
        continue;
      }
      if(entry.owner === "mixed") {
        const result = path === PROJECT_MAP_PATH ? replaceMarkdownManagedBlock(current, candidate) : replaceManagedBlocks(current, candidate);
        if(result.changed) { zip.file(zipPath(existingProject, path), result.content); changes.modified.push(path); }
        else changes.skipped.push({path, reason:"Mixed-owned file has no matching managed block"});
        continue;
      }
      changes.skipped.push({path, reason:"Human-owned or unsafe-to-overwrite file preserved"});
    }

    const changeFile = zip.file(zipPath(existingProject, CHANGELOG_PATH));
    const existingChangelog = changeFile ? await changeFile.async("string") : "# Changelog\n";
    const date = new Date().toISOString().slice(0,10);
    const marker = "qa-blueprint-" + Date.now();
    const entry = {
      marker,
      content:[
        "## " + date + " — " + reason,
        "<!-- " + marker + " -->",
        "- Files created: " + (changes.created.join(", ") || "none"),
        "- Files modified: " + (changes.modified.join(", ") || "none"),
        "- Files intentionally not touched: " + (changes.skipped.map((item) => item.path).join(", ") || "none")
      ].join("\n")
    };
    zip.file(zipPath(existingProject, CHANGELOG_PATH), appendChangelog(existingChangelog, entry));
    if(changeFile) changes.modified.push(CHANGELOG_PATH); else changes.created.push(CHANGELOG_PATH);

    const mergedManifest = mergeManifest(previous, templateManifest, changes, reason);
    zip.file(zipPath(existingProject, MANIFEST_PATH), JSON.stringify(mergedManifest, null, 2));
    if(existingProject.paths.has(MANIFEST_PATH)) changes.modified.push(MANIFEST_PATH); else changes.created.push(MANIFEST_PATH);
    return {zip, changes, manifest:mergedManifest};
  }

  global.QABlueprintProjectModel = {
    MANIFEST_PATH,
    PROJECT_MAP_PATH,
    CHANGELOG_PATH,
    manifestEntry,
    normalizeManifest,
    readExistingProject,
    createProject,
    maintainProject,
    replaceManagedBlocks
  };
})(window);
