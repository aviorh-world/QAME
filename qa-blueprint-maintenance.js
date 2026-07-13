(function(global){
  "use strict";

  const model = global.QABlueprintProjectModel;
  const templates = global.QABlueprintProductionTemplates;
  const legacyDownloadZip = global.downloadZip;
  let loadedProject = null;

  function html(){
    const domains = ["auto", ...templates.DOMAINS].map((domain) => `<option value="${domain}">${domain === "auto" ? "Auto-detect (recommended)" : domain}</option>`).join("");
    return `<section class="card qa-maintenance-card" id="qaMaintenancePanel">
      <h2><span class="num">3</span> Deterministic project output</h2>
      <p class="hint">Create a production suite or maintain an existing Playwright ZIP. Existing ZIPs are read locally in this browser and are not uploaded.</p>
      <div class="qa-maintenance-grid">
        <label><span>Operation</span><select id="qaProjectMode"><option value="create">Create new project</option><option value="maintain">Maintain existing ZIP</option></select></label>
        <label><span>Output structure</span><select id="qaOutputStyle"><option value="production">Production modular (recommended)</option><option value="legacy">Legacy compatible ZIP</option></select></label>
        <label><span>Domain</span><select id="qaDomain">${domains}</select></label>
        <label><span>Existing Playwright ZIP</span><input id="qaExistingZip" type="file" accept=".zip,application/zip" disabled></label>
      </div>
      <label class="qa-summary-label"><span>Maintenance request / changelog reason</span><input id="qaRequestSummary" value="Generate or update the Playwright suite from the current QA Blueprint"></label>
      <div id="qaMaintenanceStatus" class="hint qa-maintenance-status">Create mode will generate a new manifest-governed project.</div>
    </section>`;
  }

  function installStyles(){
    const style = document.createElement("style");
    style.textContent = `.qa-maintenance-card{margin-top:16px}.qa-maintenance-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.qa-maintenance-grid label,.qa-summary-label{display:grid;gap:6px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}.qa-summary-label{margin-top:12px}.qa-maintenance-status{margin:12px 0 0;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:var(--panel-2);white-space:pre-wrap;text-transform:none;letter-spacing:normal}.qa-maintenance-status.ok{color:#a7f3d0;border-color:rgba(16,185,129,.45)}.qa-maintenance-status.warn{color:#fde68a;border-color:rgba(251,191,36,.45)}@media(max-width:720px){.qa-maintenance-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  function installUI(){
    installStyles();
    const preview = document.getElementById("preview");
    preview.insertAdjacentHTML("beforebegin", html());
    const mode = document.getElementById("qaProjectMode");
    const zip = document.getElementById("qaExistingZip");
    const output = document.getElementById("qaOutputStyle");
    mode.addEventListener("change", () => {
      const maintaining = mode.value === "maintain";
      zip.disabled = !maintaining;
      if(maintaining && output.value === "legacy") output.value = "production";
      output.querySelector('option[value="legacy"]').disabled = maintaining;
      status(maintaining ? "Choose the latest project ZIP. All existing files will be preserved unless its manifest explicitly permits an update." : "Create mode will generate a new manifest-governed project.");
    });
    zip.addEventListener("change", inspectZip);
    document.getElementById("downloadZipBtn").textContent = "Download project ZIP";
  }

  function status(message, kind){
    const node = document.getElementById("qaMaintenanceStatus");
    node.textContent = message;
    node.className = "hint qa-maintenance-status" + (kind ? " " + kind : "");
  }

  async function inspectZip(){
    const file = document.getElementById("qaExistingZip").files[0];
    loadedProject = null;
    if(!file) return status("Choose the existing Playwright ZIP to maintain.", "warn");
    try{
      status("Reading ZIP inventory locally…");
      loadedProject = await model.readExistingProject(file);
      const prefix = loadedProject.manifestWasMissing
        ? "No manifest was found. Existing files were baselined as human-owned and will not be overwritten."
        : "Manifest loaded and ownership rules are ready.";
      const rootNote = loadedProject.pathPrefix ? `\nDetected ZIP root folder: ${loadedProject.pathPrefix}` : "";
      status(`${prefix}${rootNote}\n${loadedProject.paths.size} existing project files inventoried.`, loadedProject.manifestWasMissing ? "warn" : "ok");
    }catch(error){
      status(error.message, "warn");
    }
  }

  function saveBlob(blob, name){
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function report(result, domain, warning){
    const skipped = result.changes.skipped || [];
    const lines = [
      `Domain: ${domain}`,
      `Created: ${result.changes.created.length}`,
      `Modified: ${result.changes.modified.length}`,
      `Preserved/skipped: ${skipped.length}`
    ];
    if(warning) lines.push(warning);
    if(skipped.length) lines.push("Preserved: " + skipped.slice(0, 8).map((item) => item.path).join(", ") + (skipped.length > 8 ? "…" : ""));
    status(lines.join("\n"), warning ? "warn" : "ok");
  }

  async function enhancedDownloadZip(){
    if(!currentBlueprint) return;
    const mode = document.getElementById("qaProjectMode").value;
    const outputStyle = document.getElementById("qaOutputStyle").value;
    if(outputStyle === "legacy") return legacyDownloadZip.call(global);

    const button = document.getElementById("downloadZipBtn");
    button.disabled = true;
    status("Building deterministic project…");
    try{
      const built = templates.build(currentBlueprint, {domain:document.getElementById("qaDomain").value});
      const requestSummary = document.getElementById("qaRequestSummary").value.trim() || "Updated from QA Blueprint";
      let result;
      let warning = "";
      let fileName = `qa-blueprint-${built.domain}-production.zip`;
      if(mode === "maintain") {
        const file = document.getElementById("qaExistingZip").files[0];
        if(!file) throw new Error("Choose an existing Playwright ZIP before maintaining it.");
        if(!loadedProject || loadedProject.fileName !== file.name) loadedProject = await model.readExistingProject(file);
        const wasMissing = loadedProject.manifestWasMissing;
        result = await model.maintainProject(loadedProject, built.files, built.manifest, {requestSummary});
        warning = wasMissing ? "Safe baseline used: pre-existing files were not overwritten." : "";
        loadedProject = {
          zip:result.zip,
          paths:new Set(result.manifest.files.map((entry) => entry.path)),
          manifest:result.manifest,
          manifestWasMissing:false,
          fileName:file.name,
          pathPrefix:loadedProject.pathPrefix || ""
        };
        fileName = file.name.replace(/\.zip$/i, "") + "-maintained.zip";
      } else {
        result = await model.createProject(built.files, built.manifest);
      }
      const blob = await result.zip.generateAsync({type:"blob", compression:"DEFLATE", compressionOptions:{level:6}});
      saveBlob(blob, fileName);
      report(result, built.domain, warning);
      if(typeof global.setMessage === "function") global.setMessage(`Project ZIP ready: ${result.changes.created.length} created, ${result.changes.modified.length} modified.`, "ok");
    }catch(error){
      status(error.message, "warn");
      if(typeof global.setMessage === "function") global.setMessage(error.message, "warn");
    }finally{
      button.disabled = !currentBlueprint;
    }
  }

  installUI();
  global.downloadZip = enhancedDownloadZip;
})(window);
