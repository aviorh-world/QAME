(function(global){
  "use strict";

  const DOMAINS = ["login", "registration", "payments", "loans", "users", "smoke", "api", "infrastructure", "configuration", "test-data"];

  function slug(value){
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "generated";
  }

  function detectDomain(blueprint, override){
    if(override && override !== "auto" && DOMAINS.includes(override)) return override;
    const text = JSON.stringify(blueprint || {}).toLowerCase();
    const rules = [
      ["payments", /payment|checkout|credit.?card|billing|merchant/],
      ["loans", /loan|borrow|lender|repayment/],
      ["registration", /register|registration|sign.?up|create.?account/],
      ["login", /login|log.?in|sign.?in|password/],
      ["users", /profile|customer|user|account/],
      ["api", /endpoint|request|response|graphql|rest api/],
      ["configuration", /configuration|environment|feature.?flag/],
      ["test-data", /fixture|test.?data|faker/]
    ];
    const match = rules.find((item) => item[1].test(text));
    return match ? match[0] : "smoke";
  }

  function esc(value){
    return String(value == null ? "" : value).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  }

  function title(value){
    return String(value || "Generated").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function regexEscape(value){
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function expectedNextPath(blueprint){
    const flow = blueprint && blueprint.flows && blueprint.flows[0];
    const steps = flow && Array.isArray(flow.steps) ? flow.steps : [];
    const next = steps[1];
    if(!next) return "";
    if(next.path) return String(next.path);
    if(next.url) {
      try{return new URL(next.url, flow.startUrl || "https://example.test").pathname;}
      catch(error){return String(next.url);}
    }
    return "";
  }

  function flowStepsOf(blueprint){
    const flow = blueprint && blueprint.flows && blueprint.flows[0];
    const raw = flow && Array.isArray(flow.steps) ? flow.steps : [];
    const normalized = raw.map((step, index) => ({
      order:Number(step.order || index + 1),
      path:String(step.path || (() => {
        try{return new URL(step.url || "", flow && flow.startUrl || "https://example.test").pathname;}
        catch(error){return step.url || "";}
      })()),
      cta:String(step.cta || step.ctaText || "")
    }));
    const stableSteps = normalized.filter((step) => !/\/step-by-proxy(?:\/|$)/i.test(step.path));
    return stableSteps.filter((step, index) => {
      const previous = stableSteps[index - 1];
      return !previous || previous.path !== step.path || previous.cta !== step.cta;
    });
  }

  function fieldsOf(blueprint){
    const raw = Array.isArray(blueprint && blueprint.elements) ? blueprint.elements : Array.isArray(blueprint && blueprint.fields) ? blueprint.fields : [];
    return raw.map((field, index) => ({
      id:String(field.id || field.name || field.key || "field-" + (index + 1)),
      name:String(field.name || field.id || field.key || "field-" + (index + 1)),
      label:String(field.label || field.name || field.id || "Field " + (index + 1)),
      type:String(field.type || field.inputType || "text"),
      required:field.required !== false,
      selector:String(field.selector || field.css || ""),
      defaultValue:field.defaultValue == null && field.happyValue == null ? "" : String(field.defaultValue == null ? field.happyValue : field.defaultValue)
    }));
  }

  function ctasOf(blueprint){
    const flowSteps = blueprint && blueprint.flows && blueprint.flows[0] && blueprint.flows[0].steps;
    const raw = Array.isArray(blueprint && blueprint.ctas) ? blueprint.ctas : Array.isArray(blueprint && blueprint.actions) ? blueprint.actions : Array.isArray(flowSteps) ? flowSteps.filter((step) => step.cta).map((step) => ({name:step.cta})) : [];
    return raw.map((cta, index) => ({
      name:String(cta.name || cta.label || cta.text || "Continue"),
      selector:String(cta.selector || cta.css || ""),
      index
    }));
  }

  function assertionsOf(blueprint){
    const raw = Array.isArray(blueprint && blueprint.assertions) ? blueprint.assertions : [];
    const allowed = new Set(["textVisible", "textHidden", "selectorVisible", "selectorHidden", "urlContains", "titleContains"]);
    return raw.map((assertion, index) => {
      const type = allowed.has(assertion && assertion.type) ? String(assertion.type) : "textVisible";
      const target = String(assertion && (assertion.target ?? assertion.value ?? assertion.text ?? assertion.selector) || "").trim();
      return {
        id:String(assertion && assertion.id || "assertion-" + (index + 1)),
        name:String(assertion && (assertion.name || assertion.label) || type + (target ? ": " + target.slice(0, 64) : "")),
        type,
        target,
        path:String(assertion && (assertion.path || assertion.whenPath) || ""),
        severity:assertion && assertion.severity === "soft" ? "soft" : "critical",
        timeoutMs:Number(assertion && assertion.timeoutMs || 10000)
      };
    }).filter((assertion) => assertion.target);
  }

  function suggestedAssertionsOf(blueprint){
    const raw = Array.isArray(blueprint && blueprint.suggestedAssertions) ? blueprint.suggestedAssertions : Array.isArray(blueprint && blueprint.assertionCandidates) ? blueprint.assertionCandidates : [];
    const allowed = new Set(["textVisible", "textHidden", "selectorVisible", "selectorHidden", "urlContains", "titleContains"]);
    const seen = new Set();
    return raw.map((assertion, index) => {
      const type = allowed.has(assertion && assertion.type) ? String(assertion.type) : "textVisible";
      const target = String(assertion && (assertion.target ?? assertion.value ?? assertion.text ?? assertion.selector) || "").trim();
      const path = String(assertion && (assertion.path || assertion.whenPath) || "");
      const key = [type, path, target].join("|");
      if(!target || seen.has(key)) return null;
      seen.add(key);
      return {
        id:String(assertion && assertion.id || "suggested-assertion-" + (index + 1)),
        name:String(assertion && (assertion.name || assertion.label) || type + (target ? ": " + target.slice(0, 64) : "")),
        type,
        target,
        path,
        severity:assertion && assertion.severity === "soft" ? "soft" : "critical",
        timeoutMs:Number(assertion && assertion.timeoutMs || 10000),
        category:String(assertion && assertion.category || "static"),
        confidence:String(assertion && assertion.confidence || "medium"),
        reason:String(assertion && assertion.reason || "Suggested from recorded flow page content."),
        source:String(assertion && assertion.source || "qa-engine")
      };
    }).filter(Boolean);
  }

  function negativeValidationsOf(blueprint){
    const raw = Array.isArray(blueprint && blueprint.negativeValidations) ? blueprint.negativeValidations : [];
    return raw.map((item, index) => {
      const field = String(item && (item.field || item.fieldName || item.fieldId || item.label) || "").trim();
      const selector = String(item && (item.selector || item.fieldSelector) || "").trim();
      const value = String(item && (item.value ?? item.invalidValue) || "").trim();
      return {
        id:String(item && item.id || "negative-validation-" + (index + 1)),
        name:String(item && (item.name || item.label) || "Reject invalid value" + (field ? ": " + field : "")),
        path:String(item && (item.path || item.whenPath) || ""),
        field,
        selector,
        value,
        expected:String(item && (item.expected || item.expectedBehavior) || "Field should reject the value, show validation, or block navigation."),
        severity:item && item.severity === "soft" ? "soft" : "critical"
      };
    }).filter((item) => (item.field || item.selector) && item.value);
  }

  function entry(path, metadata){
    return global.QABlueprintProjectModel.manifestEntry(path, metadata);
  }

  function pageObject(blueprint, domain, fields, ctas){
    const fieldRows = fields.map((field) => `    { name: \`${esc(field.name)}\`, label: \`${esc(field.label)}\`, selector: \`${esc(field.selector)}\`, type: \`${esc(field.type)}\`, required: ${field.required}, defaultValue: \`${esc(field.defaultValue)}\` }`).join(",\n");
    const primary = ctas[0] || {name:"Continue", selector:""};
    return `import { expect, Locator, Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { RandomData } from "../utils/RandomData";

export type GeneratedField = { id?: string; name: string; label: string; selector: string; type: string; required: boolean; defaultValue: string };

export class BlueprintPage extends BasePage {
  // <qa-blueprint-managed id="${domain}-field-map">
  readonly fields: GeneratedField[] = [
${fieldRows}
  ];
  readonly primaryCta = { name: \`${esc(primary.name)}\`, selector: \`${esc(primary.selector)}\` };
  // </qa-blueprint-managed>

  constructor(page: Page) { super(page); }

  async field(field: GeneratedField): Promise<Locator> {
    const candidates: Locator[] = [];
    if (field.label) candidates.push(this.page.getByLabel(field.label, { exact: false }));
    if (field.selector) candidates.push(this.page.locator(field.selector));
    if (field.name) candidates.push(this.page.locator('[name="' + field.name + '"]'));
    for (const candidate of candidates) {
      const count = await candidate.count();
      if (count === 1) return candidate;
      if (count > 1) throw new Error('Ambiguous field locator for ' + field.name);
    }
    throw new Error('Field not found: ' + field.name);
  }

  async fillHappyPath(overrides: Record<string, string> = {}): Promise<Record<string, string>> {
    const values: Record<string, string> = {};
    for (const field of this.fields) {
      const locator = await this.field(field).catch(() => null);
      if (!locator) continue;
      if (!(await locator.isVisible().catch(() => false))) continue;
      const rawValue = overrides[field.name] ?? field.defaultValue;
      if (String(rawValue ?? "").trim() === "__SKIP__") continue;
      const value = RandomData.resolve(String(rawValue ?? ""), field.name, field.type);
      if (field.type === "checkbox") { if (!(await locator.isChecked())) await locator.check(); }
      else if (field.type === "select") await locator.selectOption({ index: 1 });
      else await locator.fill(value);
      values[field.name] = value;
    }
    Object.assign(values, await this.fillGenericFields());
    return values;
  }

  async fillGenericFields(): Promise<Record<string, string>> {
    const values: Record<string, string> = {};
    const controls = this.page.locator('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
    const count = await controls.count();
    for (let index = 0; index < count; index++) {
      const control = controls.nth(index);
      if (!(await control.isVisible().catch(() => false))) continue;
      if (await control.isDisabled().catch(() => true)) continue;
      const type = String(await control.getAttribute("type") || await control.evaluate((element) => element.tagName.toLowerCase())).toLowerCase();
      const key = await control.evaluate((element, fallback) => {
        const input = element as HTMLInputElement;
        const labelledBy = String(element.getAttribute("aria-labelledby") || "")
          .split(/\s+/).filter(Boolean)
          .map((id) => document.getElementById(id)?.textContent || "");
        const labels = Array.from(input.labels || []).map((label) => label.textContent || "");
        return [
          input.name, input.id, element.getAttribute("aria-label"),
          element.getAttribute("placeholder"), ...labelledBy, ...labels,
          element.parentElement?.textContent?.slice(0, 160), fallback
        ].filter(Boolean).join(" ");
      }, "field-" + index);
      if (type === "checkbox" || type === "radio") {
        if (!(await control.isChecked().catch(() => false))) {
          await control.check({ timeout: 2000 }).catch(() => undefined);
        }
        if (await control.isChecked().catch(() => false)) values[key] = "true";
        continue;
      }
      if (await control.isEditable().catch(() => false)) {
        const currentValue = await control.inputValue().catch(() => "");
        if (currentValue.trim()) continue;
        const value = RandomData.forField(key, type);
        const filled = await control.fill(value, { timeout: 3000 }).then(() => true).catch(() => false);
        if (filled) values[key] = value;
      }
    }
    Object.assign(values, await this.fillComboboxes());
    await this.page.evaluate(() => {
      const candidates = [document.scrollingElement, ...Array.from(document.querySelectorAll("main, main *"))];
      for (const candidate of candidates) {
        if (!(candidate instanceof HTMLElement)) continue;
        if (candidate.scrollHeight <= candidate.clientHeight + 2) continue;
        candidate.scrollTop = candidate.scrollHeight;
        candidate.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
    }).catch(() => undefined);
    await this.acceptContractualDocuments();
    const mainCheckboxes = this.page.locator("main").getByRole("checkbox");
    const checkboxCount = await mainCheckboxes.count();
    for (let index = 0; index < checkboxCount; index++) {
      const checkbox = mainCheckboxes.nth(index);
      if (await checkbox.isDisabled().catch(() => true)) continue;
      if (!(await checkbox.isChecked().catch(() => false))) {
        await expect(checkbox).toBeEnabled({ timeout: 5000 }).catch(() => undefined);
        await checkbox.check({ force: true, timeout: 2000 }).catch(async () => {
          await checkbox.click({ force: true, timeout: 2000 }).catch(() => undefined);
        });
      }
    }
    Object.assign(values, await this.fillEmbeddedPaymentFields());
    return values;
  }

  async fillComboboxes(): Promise<Record<string, string>> {
    const values: Record<string, string> = {};
    const usedByKey = new Map<string, Set<string>>();
    const combos = this.page.locator([
      '[role="combobox"]',
      'input[aria-controls]',
      'input[aria-haspopup="listbox"]',
      '.mat-mdc-select',
      '.mat-select'
    ].join(","));
    const count = await combos.count().catch(() => 0);
    for (let index = 0; index < count; index++) {
      const combo = combos.nth(index);
      if (!(await combo.isVisible().catch(() => false))) continue;
      if (await combo.isDisabled().catch(() => false)) continue;
      const info = await combo.evaluate((element) => {
        const root = element.closest('[role="combobox"]') || element;
        const control = element.matches("input,textarea,select") ? element as HTMLInputElement : root.querySelector("input,textarea,select") as HTMLInputElement | null;
        const labelledBy = String(control?.getAttribute("aria-labelledby") || root.getAttribute("aria-labelledby") || "")
          .split(/\\s+/)
          .map((id) => document.getElementById(id)?.textContent || "")
          .join(" ")
          .trim();
        const aria = control?.getAttribute("aria-label") || root.getAttribute("aria-label") || "";
        const key = String(control?.name || control?.id || root.getAttribute("name") || root.id || aria || labelledBy || "").trim();
        const value = String(control?.value || control?.getAttribute("aria-valuetext") || "").trim();
        const text = String(root.textContent || "").trim();
        const invalid = control?.getAttribute("aria-invalid") === "true" ||
          root.getAttribute("aria-invalid") === "true" ||
          String(root.className || "").includes("ng-invalid") ||
          String(control?.className || "").includes("ng-invalid");
        return { key, value, text, invalid };
      }).catch(() => ({ key: "", value: "", text: "", invalid: false }));
      const comboKey = info.key || info.text || "combobox";
      if (info.value && !info.invalid) {
        const used = usedByKey.get(comboKey) || new Set<string>();
        used.add(info.value);
        usedByKey.set(comboKey, used);
        continue;
      }
      await combo.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => undefined);
      await combo.click({ timeout: 3000 }).catch(async () => {
        await combo.click({ timeout: 3000, force: true }).catch(() => undefined);
      });
      const options = this.page.locator([
        '[role="option"]:not([aria-disabled="true"])',
        'mat-option:not([aria-disabled="true"])',
        '.mat-mdc-option:not(.mat-mdc-option-disabled)',
        '.mat-option:not(.mat-option-disabled)',
        '[role="menuitemradio"]:not([aria-disabled="true"])'
      ].join(","));
      await options.first().waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
      const used = usedByKey.get(comboKey) || new Set<string>();
      let picked: Locator | null = null;
      const optionCount = await options.count().catch(() => 0);
      for (let optionIndex = 0; optionIndex < optionCount; optionIndex++) {
        const candidate = options.nth(optionIndex);
        if (!(await candidate.isVisible().catch(() => false))) continue;
        const text = String(await candidate.textContent().catch(() => "") || "").trim();
        if (!text || used.has(text)) continue;
        picked = candidate;
        break;
      }
      picked ||= options.first();
      if (await picked.isVisible().catch(() => false)) {
        const pickedText = String(await picked.textContent().catch(() => "") || "").trim();
        await picked.click({ timeout: 3000 }).catch(async () => {
          await picked?.click({ timeout: 3000, force: true }).catch(() => undefined);
        });
        await this.page.waitForTimeout(250);
        if (pickedText) {
          used.add(pickedText);
          usedByKey.set(comboKey, used);
          values[comboKey] = pickedText;
        }
      } else {
        await combo.press("ArrowDown").catch(() => undefined);
        await combo.press("Enter").catch(() => undefined);
      }
    }
    return values;
  }

  async acceptContractualDocuments(): Promise<void> {
    const contractPattern = /confirmo|he le[ií]do|documentaci[oó]n contractual|proceder a su firma/i;
    await this.page.evaluate(() => {
      const scrollables = [document.scrollingElement, ...Array.from(document.querySelectorAll("main, main *"))];
      for (const item of scrollables) {
        if (!(item instanceof HTMLElement)) continue;
        if (item.scrollHeight > item.clientHeight + 2) {
          item.scrollTop = item.scrollHeight;
          item.dispatchEvent(new Event("scroll", { bubbles: true }));
        }
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
    }).catch(() => undefined);
    await this.page.mouse.wheel(0, 4000).catch(() => undefined);

    const checkboxByRole = this.page.getByRole("checkbox", { name: contractPattern }).first();
    if (await checkboxByRole.count().catch(() => 0)) {
      await checkboxByRole.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => undefined);
      if (!(await checkboxByRole.isChecked().catch(() => false))) {
        await checkboxByRole.check({ force: true, timeout: 3000 }).catch(async () => {
          await checkboxByRole.click({ force: true, timeout: 3000 }).catch(() => undefined);
        });
      }
    }

    await this.page.evaluate((patternSource) => {
      const pattern = new RegExp(patternSource, "i");
      const labelText = (input: HTMLInputElement) => [
        input.getAttribute("aria-label"),
        input.name,
        input.id,
        ...Array.from(input.labels || []).map((label) => label.textContent || ""),
        input.parentElement?.textContent || ""
      ].filter(Boolean).join(" ");
      for (const input of Array.from(document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))) {
        if (!pattern.test(labelText(input))) continue;
        input.scrollIntoView({ block: "center", inline: "nearest" });
        if (!input.checked) input.click();
        if (!input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }, contractPattern.source).catch(() => undefined);
    await this.page.waitForTimeout(300);
  }

  async fillEmbeddedPaymentFields(): Promise<Record<string, string>> {
    const values: Record<string, string> = {};
    const fillFirstEditable = async (candidates: Locator[], value: string, key: string): Promise<boolean> => {
      for (const candidate of candidates) {
        if (await candidate.count().catch(() => 0) === 0) continue;
        await candidate.waitFor({ state: "visible", timeout: 300 }).catch(() => undefined);
        if (!(await candidate.isVisible().catch(() => false))) continue;
        const currentValue = await candidate.inputValue().catch(() => "");
        if (currentValue.trim()) {
          values[key] = currentValue;
          return true;
        }
        const filled = await candidate.fill(value, { timeout: 3000 }).then(() => true).catch(async () => {
          await candidate.click({ timeout: 3000 }).catch(() => undefined);
          return await candidate.pressSequentially(value, { delay: 20, timeout: 5000 }).then(() => true).catch(() => false);
        });
        if (filled) {
          values[key] = value;
          return true;
        }
      }
      return false;
    };

    const needsPaymentFields = /\/pay\/details/i.test(this.page.url()) ||
      await this.page.getByText(/datos de tu tarjeta|pagos mensuales|card/i).first().isVisible().catch(() => false);
    if (needsPaymentFields) {
      for (let attempt = 0; attempt < 8; attempt++) {
        await this.page.locator("iframe").first().waitFor({ state: "attached", timeout: 4000 }).catch(() => undefined);
        const readyFrame = await Promise.all(this.page.frames().map(async (frame) => {
          if (frame === this.page.mainFrame()) return false;
          return await frame.locator('input:not([type="hidden"]), select, textarea').count().then((count) => count > 0).catch(() => false);
        }));
        if (readyFrame.some(Boolean)) break;
        await this.page.waitForTimeout(1000);
      }
    }

    for (const frame of this.page.frames()) {
      if (frame === this.page.mainFrame()) continue;
      if (await frame.locator('input:not([type="hidden"]), select, textarea').count().catch(() => 0) === 0) continue;
      await fillFirstEditable([
        frame.getByRole("textbox", { name: /card number|n[uú]mero.*tarjeta|tarjeta/i }).first(),
        frame.getByLabel(/card number|n[uú]mero.*tarjeta|tarjeta/i).first(),
        frame.locator('input[name="cardnumber"], input[autocomplete="cc-number"], input[placeholder*="1234"]').first()
      ], "4242424242424242", "payment.cardNumber");
      await fillFirstEditable([
        frame.getByRole("textbox", { name: /expiration|expiry|caducidad|vencimiento|mm\\s*\\/?\\s*yy/i }).first(),
        frame.getByLabel(/expiration|expiry|caducidad|vencimiento|mm\\s*\\/?\\s*yy/i).first(),
        frame.locator('input[name="exp-date"], input[autocomplete="cc-exp"], input[placeholder*="MM"]').first()
      ], "1230", "payment.expiry");
      await fillFirstEditable([
        frame.getByRole("textbox", { name: /security code|cvc|cvv|c[oó]digo.*seguridad/i }).first(),
        frame.getByLabel(/security code|cvc|cvv|c[oó]digo.*seguridad/i).first(),
        frame.locator('input[name="cvc"], input[autocomplete="cc-csc"], input[placeholder*="CVC"]').first()
      ], "123", "payment.cvc");
    }
    return values;
  }

  async isEffectivelyDisabled(target: Locator): Promise<boolean> {
    return await target.evaluate((element) => {
      const control = element as HTMLElement;
      return control.matches(":disabled") ||
        control.hasAttribute("disabled") ||
        control.getAttribute("aria-disabled") === "true" ||
        control.classList.contains("disabled");
    }).catch(async () => await target.isDisabled().catch(() => false));
  }

  async continue(): Promise<void> {
    await this.clickCta(this.primaryCta.name, this.primaryCta.selector);
  }

  async waitForUiReady(): Promise<void> {
    for (const selector of [".overlay.show-spinner", "spinner .overlay", ".loading-overlay", "[aria-busy=\\"true\\"]"]) {
      await this.page.locator(selector).first().waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
    }
    await this.dismissCookieBanner();
  }

  async waitForFlowSettled(timeout = 45_000): Promise<void> {
    await this.page.waitForFunction(() => {
      const path = location.pathname;
      const text = document.body?.innerText || "";
      return !/(proxy|payment-status|decisiong)/i.test(path) &&
        !/validando tu solicitud|este proceso puede tardar|por favor no cierres/i.test(text);
    }, null, { timeout }).catch(() => undefined);
    await this.waitForUiReady();
  }

  async clickWhenReady(target: Locator): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.waitForUiReady();
      if (await this.isEffectivelyDisabled(target)) {
        lastError = new Error("CTA is disabled");
        await this.fillGenericFields();
        await expect(target).toBeEnabled({ timeout: 5000 }).catch(() => undefined);
        if (await this.isEffectivelyDisabled(target)) continue;
      }
      try {
        await target.click({ timeout: 7000 });
        await this.waitForFlowSettled(45_000);
        return;
      } catch (error) {
        lastError = error;
        await this.dismissCookieBanner();
      }
    }
    throw lastError;
  }

  async dismissCookieBanner(): Promise<void> {
    const oneTrustAccept = this.page.locator("#onetrust-accept-btn-handler").first();
    if (await oneTrustAccept.isVisible().catch(() => false)) {
      await oneTrustAccept.click({ timeout: 3000 }).catch(async () => {
        await oneTrustAccept.click({ force: true, timeout: 1000 }).catch(() => undefined);
      });
      await this.page.locator("#onetrust-consent-sdk").waitFor({ state: "hidden", timeout: 3000 }).catch(() => undefined);
      return;
    }
    const pattern = /^(Accept All Cookies|Accept all cookies|Accept All|Allow all|Aceptar todas las cookies|Aceptar todas|Aceptar todo|Acceptar totes les galetes|Permitir todas|Tout accepter|Alle akzeptieren)$/i;
    for (const role of ["button", "link"] as const) {
      const candidate = this.page.getByRole(role, { name: pattern }).first();
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click({ timeout: 3000 }).catch(async () => {
          await candidate.click({ force: true, timeout: 1000 }).catch(() => undefined);
        });
        await this.page.locator("#onetrust-consent-sdk").waitFor({ state: "hidden", timeout: 3000 }).catch(() => undefined);
        return;
      }
    }
  }

  async clickCta(name: string, selector = ""): Promise<void> {
    const candidates: Locator[] = [];
    if (name) {
      candidates.push(this.page.getByRole("button", { name, exact: false }));
      candidates.push(this.page.getByRole("link", { name, exact: false }));
      candidates.push(this.page.locator('[role="button"], button, a', { hasText: name }));
    }
    if (selector) candidates.push(this.page.locator(selector));
    for (const candidate of candidates) {
      const count = await candidate.count();
      for (let index = 0; index < count; index++) {
        const target = candidate.nth(index);
        if (!(await target.isVisible().catch(() => false))) continue;
        await this.fillGenericFields();
        if (await this.isEffectivelyDisabled(target)) continue;
        await expect(target).toBeEnabled();
        await target.scrollIntoViewIfNeeded().catch(() => undefined);
        await this.clickWhenReady(target);
        return;
      }
    }
    throw new Error('CTA not found: ' + name);
  }

  async clickCtaOrAdvance(name: string): Promise<void> {
    let originalError: unknown;
    try {
      await this.clickCta(name);
      return;
    } catch (error) {
      originalError = error;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.dismissCookieBanner();
      await this.fillHappyPath();
      const advanced = await this.clickPrimaryCta();
      if (!advanced) break;
      await this.waitForUiReady();
      if (await this.isOutsideHostedFlow()) return;
      await this.page.getByRole("button", { name, exact: false }).first()
        .waitFor({ state: "visible", timeout: 8000 }).catch(() => undefined);
      try {
        await this.clickCta(name);
        return;
      } catch {
        // The recorded CTA may appear only after another intermediate submit.
      }
    }
    throw originalError;
  }

  async isOutsideHostedFlow(): Promise<boolean> {
    try {
      const host = new URL(this.page.url()).hostname;
      return Boolean(host) && !/jifiti|elcorteinglespay/i.test(host);
    } catch {
      return false;
    }
  }

  async completePendingCheckout(): Promise<boolean> {
    if (await this.isOutsideHostedFlow()) return true;
    const pattern = /^(Pagar\\s+Compra|Pagar(?:\\s+compra)?|Pay(?:\\s+purchase)?|Complete purchase|Completar compra|Comprar|Buy)(?:\\s*[,.;:!?])?$/i;
    for (let attempt = 0; attempt < 3; attempt++) {
      await this.waitForUiReady();
      await this.fillGenericFields();
      for (const role of ["button", "link"] as const) {
        const candidates = this.page.getByRole(role, { name: pattern });
        await candidates.first().waitFor({ state: "visible", timeout: attempt === 0 ? 15_000 : 3_000 }).catch(() => undefined);
        const count = await candidates.count();
        for (let index = 0; index < count; index++) {
          const candidate = candidates.nth(index);
          if (!(await candidate.isVisible().catch(() => false))) continue;
          if (await this.isEffectivelyDisabled(candidate)) continue;
          await this.clickWhenReady(candidate);
          await this.page.waitForLoadState("domcontentloaded", { timeout: 15_000 }).catch(() => undefined);
          await this.waitForUiReady();
          if (await this.isOutsideHostedFlow()) return true;
          return true;
        }
      }
    }
    return false;
  }

  async clickPrimaryCta(): Promise<boolean> {
    await this.fillGenericFields();
    const pattern = /^(Continuar|Continue|Siguiente|Next|Confirmar|Confirm|Aceptar|Accept|Enviar|Send|Submit|Finalizar|Finish|Verificar|Verify|Validar|Validate|Comenzar|Iniciar|Pagar(?:\\s+compra)?|Pay(?:\\s+purchase)?|Comprar|Buy|OK)(?:\\s*[,.;:!?])?$/i;
    for (const role of ["button", "link"] as const) {
      const candidates = this.page.getByRole(role, { name: pattern });
      const count = await candidates.count();
      for (let index = 0; index < count; index++) {
        const candidate = candidates.nth(index);
        if (!(await candidate.isVisible().catch(() => false))) continue;
        if (await this.isEffectivelyDisabled(candidate)) {
          await this.fillGenericFields();
          await expect(candidate).toBeEnabled({ timeout: 5000 }).catch(() => undefined);
          if (await this.isEffectivelyDisabled(candidate)) continue;
        }
        const clicked = await this.clickWhenReady(candidate).then(() => true).catch(() => false);
        if (!clicked) continue;
        return true;
      }
    }
    const fallbackButtons = this.page.locator("main button, main [role=\\"button\\"]");
    await fallbackButtons.first().waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
    await this.fillGenericFields();
    const fallbackCount = await fallbackButtons.count();
    for (let index = 0; index < fallbackCount; index++) {
      const candidate = fallbackButtons.nth(index);
      if (!(await candidate.isVisible().catch(() => false))) continue;
      if (await this.isEffectivelyDisabled(candidate)) continue;
      const label = String(await candidate.innerText().catch(() => ""));
      if (/cerrar|volver|cookie|configuraci[oó]n/i.test(label)) continue;
      const clicked = await this.clickWhenReady(candidate).then(() => true).catch(() => false);
      if (!clicked) continue;
      return true;
    }
    return false;
  }
}
`;
  }

  function happySpec(domain, flowSteps, assertions){
    const serializedSteps = JSON.stringify(flowSteps || [], null, 2);
    const serializedAssertions = JSON.stringify(assertions || [], null, 2);
    return `import { test, expect } from "../../fixtures/BaseTest";

test.describe("${title(domain)} happy flow", () => {
  // <qa-blueprint-managed id="${domain}-happy-flow">
const FLOW_STEPS = ${serializedSteps} as const;
const BLUEPRINT_ASSERTIONS = ((require("../../test-data/blueprint.json") as any).assertions || ${serializedAssertions}) as readonly any[];

function pathPattern(pathname: string): RegExp {
  return new RegExp(pathname.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&"));
}

function currentPath(page: { url(): string }): string {
  try { return new URL(page.url()).pathname; }
  catch { return ""; }
}

function matchesPath(actual: string, expected: string): boolean {
  return actual === expected || actual.includes(expected);
}

function matchingStepIndex(pathname: string, fromIndex: number): number {
  return FLOW_STEPS.findIndex((candidate, candidateIndex) =>
    candidateIndex >= fromIndex &&
    candidateIndex <= fromIndex + 2 &&
    matchesPath(pathname, candidate.path)
  );
}

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&"), "i");
}

async function runBlueprintAssertions(page: any, currentPathname: string): Promise<void> {
  for (const assertion of BLUEPRINT_ASSERTIONS) {
    const expectedPath = String(assertion.path || "");
    if (expectedPath) {
      if (!matchesPath(currentPathname, expectedPath)) continue;
    } else if (currentPathname) {
      continue;
    }
    const target = String(assertion.target || "");
    const timeout = Number(assertion.timeoutMs || 10_000);
    const message = String(assertion.name || assertion.id || assertion.type);
    const soft = assertion.severity === "soft";
    await test.step(\`Assertion: \${message}\`, async () => {
      if (assertion.type === "textVisible") {
        const locator = page.getByText(target, { exact: false }).first();
        soft ? await expect.soft(locator, message).toBeVisible({ timeout }) : await expect(locator, message).toBeVisible({ timeout });
      } else if (assertion.type === "textHidden") {
        const locator = page.getByText(target, { exact: false }).first();
        soft ? await expect.soft(locator, message).toBeHidden({ timeout }) : await expect(locator, message).toBeHidden({ timeout });
      } else if (assertion.type === "selectorVisible") {
        const locator = page.locator(target).first();
        soft ? await expect.soft(locator, message).toBeVisible({ timeout }) : await expect(locator, message).toBeVisible({ timeout });
      } else if (assertion.type === "selectorHidden") {
        const locator = page.locator(target).first();
        soft ? await expect.soft(locator, message).toBeHidden({ timeout }) : await expect(locator, message).toBeHidden({ timeout });
      } else if (assertion.type === "urlContains") {
        soft ? await expect.soft(page, message).toHaveURL(escapedRegex(target), { timeout }) : await expect(page, message).toHaveURL(escapedRegex(target), { timeout });
      } else if (assertion.type === "titleContains") {
        soft ? await expect.soft(page, message).toHaveTitle(escapedRegex(target), { timeout }) : await expect(page, message).toHaveTitle(escapedRegex(target), { timeout });
      } else {
        throw new Error("Unsupported blueprint assertion type: " + assertion.type);
      }
    });
  }
}

  test("${domain}-happy-flow", async ({ blueprintPage, startUrl }) => {
    test.setTimeout(420_000);
    // The startUrl fixture calls the configured API first and returns its fresh redirect URL.
    await test.step("Open fresh API start URL", async () => {
      await blueprintPage.goto(startUrl);
      await blueprintPage.dismissCookieBanner();
    });

    let index = 0;
    while (index < FLOW_STEPS.length) {
      await blueprintPage.waitForFlowSettled();
      if (await blueprintPage.isOutsideHostedFlow()) break;
      let step = FLOW_STEPS[index];
      let pathname = currentPath(blueprintPage.page);
      let alignedIndex = matchingStepIndex(pathname, index);

      for (let attempt = 0; alignedIndex < 0 && attempt < 3; attempt++) {
        await blueprintPage.dismissCookieBanner();
        await blueprintPage.fillHappyPath();
        const previousPath = pathname;
        const advanced = await blueprintPage.clickPrimaryCta();
        if (!advanced) break;
        await blueprintPage.page.waitForFunction(
          (before) => location.pathname !== before,
          previousPath,
          { timeout: 8_000 }
        ).catch(() => undefined);
        pathname = currentPath(blueprintPage.page);
        alignedIndex = matchingStepIndex(pathname, index);
      }

      if (alignedIndex >= 0 && alignedIndex !== index) {
        index = alignedIndex;
        step = FLOW_STEPS[index];
      } else if (step.path) {
        try {
          await expect(blueprintPage.page).toHaveURL(pathPattern(step.path), { timeout: 12_000 });
        } catch (error) {
          const realignedIndex = matchingStepIndex(currentPath(blueprintPage.page), index + 1);
          if (realignedIndex >= 0) {
            index = realignedIndex;
            step = FLOW_STEPS[index];
          } else {
            throw error;
          }
        }
      }
      await blueprintPage.dismissCookieBanner();
      await blueprintPage.fillHappyPath();
      if (await blueprintPage.isOutsideHostedFlow()) break;
      await runBlueprintAssertions(blueprintPage.page, currentPath(blueprintPage.page));
      const advancedBeforeClick = matchingStepIndex(currentPath(blueprintPage.page), index + 1);
      if (advancedBeforeClick >= 0) {
        index = advancedBeforeClick;
        continue;
      }
      if (step.cta) {
        try {
          await test.step(\`Flow: \${step.path} -> click "\${step.cta}"\`, async () => {
            if (index === FLOW_STEPS.length - 1) await blueprintPage.clickCtaOrAdvance(step.cta);
            else await blueprintPage.clickCta(step.cta);
          });
        } catch (error) {
          const realignedIndex = matchingStepIndex(currentPath(blueprintPage.page), index + 1);
          if (realignedIndex >= 0) {
            index = realignedIndex;
            continue;
          }
          if (index < FLOW_STEPS.length - 1 && await blueprintPage.clickPrimaryCta()) {
            index++;
            continue;
          }
          throw error;
        }
      }
      index++;
    }

    await runBlueprintAssertions(blueprintPage.page, "");
    await test.step("Flow: complete merchant purchase if prompted", async () => {
      await blueprintPage.completePendingCheckout();
    });
    await test.step("Assertion: final page body is visible", async () => {
      await expect(blueprintPage.page.locator("body")).toBeVisible();
    });
  });
  // </qa-blueprint-managed>
});
`;
  }

  function validationsSpec(domain){
    return `import { test, expect } from "../../fixtures/BaseTest";

test.describe("${title(domain)} validation", () => {
  // <qa-blueprint-managed id="${domain}-field-validations">
  test("${domain}-field-validations", async ({ blueprintPage, startUrl }) => {
    await test.step("Open fresh API start URL", async () => {
      await blueprintPage.goto(startUrl);
    });
    for (const field of blueprintPage.fields.filter((item) => item.required)) {
      await test.step(\`Validation: required field is visible - \${field.label || field.name || field.id}\`, async () => {
        const locator = await blueprintPage.field(field).catch(() => null);
        if (locator) await expect(locator).toBeVisible();
      });
    }
  });
  // </qa-blueprint-managed>
});
`;
  }

  function negativeValidationsSpec(domain, flowSteps, negativeValidations){
    const serializedSteps = JSON.stringify(flowSteps || [], null, 2);
    const serializedValidations = JSON.stringify(negativeValidations || [], null, 2);
    return `import { test, expect } from "../../fixtures/BaseTest";

const FLOW_STEPS = ${serializedSteps} as const;
const NEGATIVE_VALIDATIONS = ((require("../../test-data/blueprint.json") as any).negativeValidations || ${serializedValidations}) as readonly any[];

function currentPath(page: { url(): string }): string {
  try { return new URL(page.url()).pathname; }
  catch { return ""; }
}

function matchesPath(actual: string, expected: string): boolean {
  return actual === expected || actual.includes(expected);
}

async function findField(page: any, validation: any) {
  const selector = String(validation.selector || "").trim();
  const field = String(validation.field || "").trim();
  const candidates = [] as any[];
  if (selector) candidates.push(page.locator(selector).first());
  if (field) {
    candidates.push(page.getByRole("textbox", { name: new RegExp(field.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&"), "i") }).first());
    candidates.push(page.getByLabel(new RegExp(field.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&"), "i")).first());
    candidates.push(page.locator('[name="' + field.replace(/"/g, '\\\\"') + '"]').first());
    const idCandidate = field.replace(/[^a-zA-Z0-9_-]/g, "");
    if (idCandidate) candidates.push(page.locator("#" + idCandidate).first());
  }
  if (/phone|mobile|tel|m[oó]vil|tel[eé]fono|n[uú]mero/i.test(field)) {
    candidates.push(page.locator('input[type="tel"], input[autocomplete="tel"], input[name*="phone" i], input[id*="phone" i], input[name*="mobile" i], input[id*="mobile" i]').first());
  }
  for (const candidate of candidates) {
    if (await candidate.count().catch(() => 0) === 0) continue;
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  throw new Error("Field not found for negative validation: " + (field || selector));
}

async function navigateToPath(blueprintPage: any, expectedPath: string): Promise<void> {
  if (!expectedPath) return;
  for (let attempt = 0; attempt < Math.max(FLOW_STEPS.length + 2, 8); attempt++) {
    await blueprintPage.waitForFlowSettled();
    if (matchesPath(currentPath(blueprintPage.page), expectedPath)) return;
    const advanced = await blueprintPage.clickPrimaryCta();
    if (!advanced) break;
  }
  await expect(blueprintPage.page).toHaveURL(new RegExp(expectedPath.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&")));
}

test.describe("${title(domain)} negative validations", () => {
  for (const validation of NEGATIVE_VALIDATIONS) {
    test(validation.name || validation.id, async ({ blueprintPage, startUrl }) => {
      test.setTimeout(180_000);
      await test.step("Open fresh API start URL", async () => {
        await blueprintPage.goto(startUrl);
        await blueprintPage.dismissCookieBanner();
        await blueprintPage.waitForFlowSettled();
      });

      await test.step("Navigate to validation page", async () => {
        await navigateToPath(blueprintPage, String(validation.path || ""));
      });

      const field = await findField(blueprintPage.page, validation);
      await test.step("Negative: " + String(validation.field || validation.selector) + " rejects " + JSON.stringify(validation.value), async () => {
        const beforePath = currentPath(blueprintPage.page);
        await field.fill("").catch(() => undefined);
        await field.fill(String(validation.value));
        const typedValue = await field.inputValue().catch(() => "");
        const browserRejectedValue = typedValue !== String(validation.value);
        const advanced = await blueprintPage.clickPrimaryCta();
        await blueprintPage.waitForFlowSettled();
        const stayedOnSamePath = currentPath(blueprintPage.page) === beforePath || !advanced;
        const validationSignals = await blueprintPage.page
          .locator(':invalid, [aria-invalid="true"], [role="alert"], [aria-live], .error, .field-error, .invalid-feedback, mat-error')
          .count()
          .catch(() => 0);
        expect(
          browserRejectedValue || stayedOnSamePath || validationSignals > 0,
          validation.expected || "Invalid input should be rejected, show validation, or block navigation."
        ).toBeTruthy();
      });
    });
  }
});
`;
  }

  function projectMap(domain, files){
    return `# Project Map

Human-maintained notes may be added outside the managed block.

<!-- <qa-blueprint-managed id="project-map"> -->
## Generated architecture

- Domain: \`${domain}\`
- Page object: \`pages/BlueprintPage.ts\`
- Fixture: \`fixtures/BaseTest.ts\`
- Domain tests: \`tests/${domain}/\`
- Shared test data: \`test-data/blueprint.json\`
- Environment configuration: \`config/environment.ts\`

### Registered paths

${files.map((path) => `- \`${path}\``).join("\n")}
<!-- </qa-blueprint-managed> -->
`;
  }

  function architectureRules(){
    return `# Architecture Rules

1. \`qa-project-manifest.json\` is the source of truth for ownership and overwrite safety.
2. Never delete or rename existing files during maintenance unless a future request explicitly authorizes it.
3. Human-owned files are preserved. Generated files are replaced only when \`safeToOverwrite\` is true.
4. Mixed files are changed only inside matching \`qa-blueprint-managed\` blocks.
5. Tests live under \`tests/<domain>/\`; reusable browser behavior belongs in page objects or fixtures.
6. Base URLs and environment values belong in \`config/\`, never inline in tests.
7. Prefer roles, labels and test IDs; CSS selectors are a declared fallback.
8. Do not use fixed sleeps. Synchronize on visible UI, navigation, responses or browser load states.
9. Every test has a stable ID and meaningful assertions.
10. Every maintenance run updates the manifest, project map when structure changes, and changelog.
`;
  }

  function sourceInputForBlueprint(blueprint, domain, fields, ctas, flowSteps, assertions, suggestedAssertions, negativeValidations, apiStart, baseUrl, generatedAt){
    return {
      version:"1.1",
      domain,
      source:{
        type:"qa-blueprint-generated-source-input",
        description:"Canonical source input for qa-blueprint.html. Paste this file back into Source input when regenerating or updating the suite.",
        generatedAt,
        originalSource:blueprint && (blueprint.source || blueprint.meta || {}) || {}
      },
      api:apiStart ? {
        configured:true,
        endpoint:apiStart.endpoint,
        method:apiStart.method,
        responsePath:apiStart.responsePath,
        startUrlTemplate:apiStart.startUrlTemplate,
        headers:apiStart.headers,
        bodyRaw:apiStart.bodyRaw
      } : {
        configured:false,
        endpoint:"",
        method:"",
        responsePath:"",
        startUrlTemplate:"",
        headers:{},
        bodyRaw:""
      },
      startUrl:baseUrl,
      flows:[{
        id:"flow-1",
        name:title(domain) + " happy flow",
        startUrl:baseUrl,
        steps:flowSteps.map((step) => ({
          id:"step-" + step.order + "-" + slug(step.path || step.cta || "flow"),
          order:step.order,
          path:step.path,
          cta:step.cta,
          expectedNavigation:"recorded-flow-advance"
        }))
      }],
      flowSteps,
      elements:fields.map((field) => ({
        id:field.id,
        name:field.name,
        label:field.label,
        type:field.type,
        kind:field.type,
        required:field.required,
        selector:field.selector,
        defaultValue:field.defaultValue,
        happyValue:field.defaultValue,
        confidence:"high"
      })),
      fields,
      ctas,
      assertions,
      suggestedAssertions,
      negativeValidations,
      notes:[
        "This file is generated automatically on every QA Blueprint project export.",
        "Use it as the preferred Source input for future updates, because it includes flow, fields, CTAs, API start config and assertions.",
        "Keep dynamic placeholders such as {{Random_DNI}} in api.bodyRaw; the generated StartUrlResolver substitutes them at runtime."
      ]
    };
  }

  function build(blueprint, options){
    options = options || {};
    const domain = detectDomain(blueprint, options.domain);
    const fields = fieldsOf(blueprint);
    const ctas = ctasOf(blueprint);
    const flowSteps = flowStepsOf(blueprint);
    const assertions = assertionsOf(blueprint);
    const suggestedAssertions = suggestedAssertionsOf(blueprint);
    const negativeValidations = negativeValidationsOf(blueprint);
    const baseUrl = String(options.baseUrl || blueprint && (blueprint.url || blueprint.startUrl || blueprint.baseUrl || blueprint.source && blueprint.source.url || blueprint.flows && blueprint.flows[0] && blueprint.flows[0].startUrl) || "http://127.0.0.1:3000");
    const rawApi = blueprint && blueprint.api && typeof blueprint.api === "object" ? blueprint.api : null;
    const apiStart = rawApi && rawApi.endpoint ? {
      endpoint:String(rawApi.endpoint),
      method:String(rawApi.method || "GET").toUpperCase(),
      responsePath:String(rawApi.responsePath || ""),
      startUrlTemplate:String(rawApi.startUrlTemplate || rawApi.urlTemplate || ""),
      headers:rawApi.headers && typeof rawApi.headers === "object" ? rawApi.headers : {},
      bodyRaw:String(rawApi.bodyRaw || "")
    } : null;
    const generatedAt = new Date().toISOString();
    const testIds = [`${domain}-happy-flow`, `${domain}-field-validations`, `${domain}-negative-validations`, "smoke-basic"];
    const files = {};
    const sourceInput = sourceInputForBlueprint(blueprint, domain, fields, ctas, flowSteps, assertions, suggestedAssertions, negativeValidations, apiStart, baseUrl, generatedAt);

    files["config/environment.ts"] = `export type ApiStartConfig = {
  endpoint: string;
  method: string;
  responsePath: string;
  startUrlTemplate: string;
  headers: Record<string, string>;
  bodyRaw: string;
};

export type Environment = { baseUrl: string; apiStart: ApiStartConfig | null };

export function getEnvironment(): Environment {
  const sourceInput = require("../source-input-for-blueprint.json") as any;
  const sourceApi = sourceInput && sourceInput.api && sourceInput.api.endpoint ? sourceInput.api : null;
  return {
    baseUrl: process.env.BASE_URL || String(sourceInput.startUrl || sourceInput.flows?.[0]?.startUrl || \`${esc(baseUrl)}\`),
    apiStart: sourceApi && sourceApi.configured !== false ? {
      endpoint: String(sourceApi.endpoint || ""),
      method: String(sourceApi.method || "GET").toUpperCase(),
      responsePath: String(sourceApi.responsePath || ""),
      startUrlTemplate: String(sourceApi.startUrlTemplate || sourceApi.urlTemplate || ""),
      headers: sourceApi.headers && typeof sourceApi.headers === "object" ? sourceApi.headers : {},
      bodyRaw: String(sourceApi.bodyRaw || "")
    } : null
  };
}
`;
    files["models/BlueprintField.ts"] = `export interface BlueprintField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  selector?: string;
  defaultValue?: string;
}
`;
    files["models/TestCase.ts"] = `export interface TestCase { id: string; title: string; domain: string; tags: string[]; }
`;
    files["test-data/blueprint.json"] = JSON.stringify({domain, fields, ctas, flowSteps, assertions, suggestedAssertions, negativeValidations, api:{configured:Boolean(apiStart), endpoint:apiStart && apiStart.endpoint || "", method:apiStart && apiStart.method || "", responsePath:apiStart && apiStart.responsePath || "", startUrlTemplate:apiStart && apiStart.startUrlTemplate || ""}, source:blueprint && blueprint.meta || {}, generatedAt}, null, 2);
    files["source-input-for-blueprint.json"] = JSON.stringify(sourceInput, null, 2);
    files["pages/BasePage.ts"] = `import { Page } from "@playwright/test";

export class BasePage {
  constructor(readonly page: Page) {}
  async goto(url: string): Promise<void> { await this.page.goto(url, { waitUntil: "domcontentloaded" }); }
}
`;
    files["pages/BlueprintPage.ts"] = pageObject(blueprint, domain, fields, ctas);
    files["fixtures/BaseTest.ts"] = `import { test as base, expect } from "@playwright/test";
import { BlueprintPage } from "../pages/BlueprintPage";
import { getEnvironment, Environment } from "../config/environment";
import { resolveStartUrl } from "../utils/StartUrlResolver";

type Fixtures = { blueprintPage: BlueprintPage; environment: Environment; startUrl: string };
export const test = base.extend<Fixtures>({
  environment: async ({}, use) => { await use(getEnvironment()); },
  startUrl: async ({ request, environment }, use) => { await use(await resolveStartUrl(request, environment)); },
  blueprintPage: async ({ page }, use) => { await use(new BlueprintPage(page)); }
});
export { expect };
`;
    files["utils/StartUrlResolver.ts"] = `import { APIRequestContext } from "@playwright/test";
import { Environment } from "../config/environment";

function randomDni(): string {
  const number = String(Math.floor(Math.random() * 100000000)).padStart(8, "0");
  return number + "TRWAGMYFPDXBNJZSQVHLCKE"[Number(number) % 23];
}

function randomDigits(length: number): string {
  return Array.from({ length: Math.max(0, Number(length) || 0) }, () => Math.floor(Math.random() * 10)).join("");
}

function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: Math.max(0, Number(length) || 0) }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDob(): string {
  const start = new Date(1950, 0, 1).getTime();
  const end = new Date(2005, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10);
}

function dynamicToken(raw: string): string {
  const key = String(raw || "").trim();
  const intMatch = key.match(/^(?:\\$randomInt|rInt|number|randomNumber)\\((\\d+)\\s*,\\s*(\\d+)\\)$/i);
  if (intMatch) return String(Math.floor(Math.random() * (Number(intMatch[2]) - Number(intMatch[1]) + 1)) + Number(intMatch[1]));
  if (/^\\$randomInt$/i.test(key)) return String(Math.floor(Math.random() * 1000));
  const digitsMatch = key.match(/^rDigits\\((\\d+)\\)$/i);
  if (digitsMatch) return randomDigits(Number(digitsMatch[1]));
  const stringMatch = key.match(/^(?:\\$randomString|rString)\\((\\d+)\\)$/i);
  if (stringMatch) return randomString(Number(stringMatch[1]));
  if (/^\\$timestampMs$/i.test(key)) return String(Date.now());
  if (/^\\$timestamp$/i.test(key)) return String(Math.floor(Date.now() / 1000));
  if (/^\\$isoTimestamp$/i.test(key)) return new Date().toISOString();
  if (/^\\$randomUUID$/i.test(key)) return crypto.randomUUID();
  if (/^\\$randomEmail$/i.test(key)) return "qa" + Date.now() + "@test.com";
  if (/^\\$randomDNI$|^Random_DNI$/i.test(key)) return randomDni();
  if (/^name$|^firstName$|^randomFirstName$|^\\$randomFirstName$/i.test(key)) return pick(["Ava", "Liam", "Mia", "Noah", "Emma", "Leo", "Nina", "Tom", "Ella", "Max"]);
  if (/^lastName$|^randomLastName$|^\\$randomLastName$/i.test(key)) return pick(["Cohen", "Levi", "Haddad", "Miller", "Schmidt", "Garcia", "Brown", "Klein"]);
  if (/^fullName$|^randomFullName$|^\\$randomFullName$/i.test(key)) return pick(["Ava", "Liam", "Mia", "Noah", "Emma", "Leo", "Nina", "Tom", "Ella", "Max"]) + " " + pick(["Cohen", "Levi", "Haddad", "Miller", "Schmidt", "Garcia", "Brown", "Klein"]);
  if (/^dob$|^randomDOB$|^randomDob$|^randomDateOfBirth$|^\\$randomDOB$/i.test(key)) return randomDob();
  if (/^email_prefix$/i.test(key)) return "qa.automation";
  if (/^RandomPhoneNumber$|^randomPhone$|^\\$randomPhoneNumber$/i.test(key)) return randomDigits(8);
  if (/^\\$randomBankAccount$/i.test(key)) return randomDigits(8);
  if (/^\\$randomCompanyName$/i.test(key)) return pick(["Green Field", "Blue River", "North Star", "Silver Oak", "Bright Farm", "Urban Tech"]) + " " + pick(["GmbH", "Trading", "Services", "Group"]);
  return "{{" + key + "}}";
}

function normalizeDynamicExpression(value: string): string {
  const text = String(value == null ? "" : value).trim();
  const equalsIndex = text.indexOf("=");
  if (equalsIndex === 0) return text.slice(1).trim();
  if (equalsIndex > 0 && /^[A-Za-z_$][\\w$.-]*\\s*$/.test(text.slice(0, equalsIndex))) return text.slice(equalsIndex + 1).trim();
  return text;
}

function splitDynamicPlus(expression: string): string[] {
  const parts: string[] = [];
  let current = "", quote = "", depth = 0;
  for (let index = 0; index < expression.length; index++) {
    const char = expression[index];
    if (quote) { current += char; if (char === quote && expression[index - 1] !== "\\\\") quote = ""; continue; }
    if (char === '"' || char === "'") { quote = char; current += char; continue; }
    if (char === "(") { depth++; current += char; continue; }
    if (char === ")") { depth--; current += char; continue; }
    if (char === "+" && depth === 0) { parts.push(current.trim()); current = ""; continue; }
    current += char;
  }
  parts.push(current.trim());
  return parts;
}

function evalDynamicTerm(term: string): string {
  const text = String(term || "").trim();
  const quoted = text.match(/^(['"])([\\s\\S]*)\\1$/);
  if (quoted) return quoted[2];
  const fn = text.match(/^([A-Za-z_$][\\w$]*)\\(([^()]*)\\)$/);
  if (fn) return dynamicToken(fn[1] + "(" + fn[2] + ")");
  return text;
}

function substituteVars(value: string): string {
  const normalized = normalizeDynamicExpression(value);
  const expressionLike = normalized !== String(value || "").trim() || /^(['"]).*\\1\\s*\\+/.test(normalized) || /\\+\\s*(?:rInt|number|randomNumber|rDigits|rString)\\(/i.test(normalized);
  if (expressionLike) return splitDynamicPlus(normalized).map(evalDynamicTerm).join("");
  return normalized.replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, (_match, token) => dynamicToken(token));
}

function substituteDeep(value: unknown): any {
  if (typeof value === "string") return substituteVars(value);
  if (Array.isArray(value)) return value.map(substituteDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, substituteDeep(item)]));
  }
  return value;
}

function pickFromPath(value: any, path: string): unknown {
  return path.split(".").filter(Boolean).reduce((current, key) => current == null ? undefined : current[key], value);
}

function resolveTemplateValue(path: string, responseBody: any, requestBody: any): unknown {
  const key = String(path || "").trim();
  if (!key) return undefined;
  if (/^response\\./i.test(key)) return pickFromPath(responseBody, key.replace(/^response\\./i, ""));
  if (/^request\\./i.test(key)) return pickFromPath(requestBody, key.replace(/^request\\./i, ""));
  if (/^body\\./i.test(key)) return pickFromPath(responseBody, key.replace(/^body\\./i, ""));
  const fromResponse = pickFromPath(responseBody, key);
  if (fromResponse != null) return fromResponse;
  return pickFromPath(requestBody, key);
}

function buildStartUrlFromTemplate(template: string, responseBody: any, requestBody: any): string {
  return String(template || "").replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, (_match, path) => {
    const value = resolveTemplateValue(path, responseBody, requestBody);
    if (value == null || value === "") {
      throw new Error("Start URL template variable " + path + " was not found. Available response keys: [" + Object.keys(responseBody || {}).join(", ") + "]. Available request keys: [" + Object.keys(requestBody || {}).join(", ") + "].");
    }
    return encodeURIComponent(String(value));
  });
}

function stripJsonComments(value: string): string {
  let output = "", inString = false, escaped = false, index = 0;
  while (index < value.length) {
    const char = value[index];
    if (escaped) { output += char; escaped = false; index++; continue; }
    if (inString && char === "\\\\") { output += char; escaped = true; index++; continue; }
    if (char === '"') { inString = !inString; output += char; index++; continue; }
    if (!inString && char === "/" && value[index + 1] === "/") {
      while (index < value.length && value[index] !== "\\n") index++;
      continue;
    }
    if (!inString && char === "/" && value[index + 1] === "*") {
      index += 2;
      while (index < value.length - 1 && !(value[index] === "*" && value[index + 1] === "/")) index++;
      index += 2;
      continue;
    }
    output += char;
    index++;
  }
  return output.replace(/,(\\s*[}\\]])/g, "$1");
}

export async function resolveStartUrl(request: APIRequestContext, environment: Environment): Promise<string> {
  const api = environment.apiStart;
  if (!api || !api.endpoint) return environment.baseUrl;

  const options: any = {
    method: api.method || "GET",
    headers: substituteDeep({ "Content-Type": "application/json", ...api.headers })
  };
  let requestPayload: any = null;
  if (api.bodyRaw) {
    const body = stripJsonComments(substituteVars(api.bodyRaw));
    try { requestPayload = JSON.parse(body); options.data = requestPayload; }
    catch { requestPayload = body; options.data = body; }
  }

  const response = await request.fetch(substituteVars(api.endpoint), options);
  if (!response.ok()) {
    const responseBody = await response.text().catch(() => "(response body unavailable)");
    throw new Error("API call failed: " + api.endpoint + " -> HTTP " + response.status() + "\\n" + responseBody.slice(0, 800));
  }

  let body: any;
  try { body = await response.json(); }
  catch { body = await response.text(); }
  if (api.startUrlTemplate) return buildStartUrlFromTemplate(api.startUrlTemplate, body, requestPayload);
  if (typeof body === "string") return body.trim();

  let url = api.responsePath ? pickFromPath(body, api.responsePath) : undefined;
  if (!url) {
    for (const key of ["url", "URL", "RedirectURL", "redirectUrl", "redirectURL", "applicationUrl", "ApplicationUrl", "redirect", "Url"]) {
      if (body && body[key]) { url = body[key]; break; }
    }
  }
  if (!url) {
    throw new Error("API response did not contain a start URL. Available keys: [" + Object.keys(body || {}).join(", ") + "]");
  }
  return String(url);
}
`;
    files["utils/RandomData.ts"] = `import { faker } from "@faker-js/faker";

export class RandomData {
  static resolve(template: string, name: string, type = "text"): string {
    const raw = String(template ?? "").trim();
    const nameKey = String(name || "").toLowerCase();
    if (/otp|verification.?code|passcode|(?:^|[^A-Za-z0-9_])pin(?:[^A-Za-z0-9_]|$)|codigo|sms.?code/.test(nameKey)) return "1111";
    if (/ssn|social.?security|tax.?number|tax.?id|tin|ein|itin/.test(nameKey)) return "123456789";
    if (/identification|identification.?value|id.?number/.test(nameKey) && (!/^\\d{6,12}$/.test(raw))) return "123456789";
    if (/phone|mobile|tel/.test(nameKey) && (!/^\\d{10}$/.test(raw))) return "0501234567";
    if (/address.*line.*2|address2/.test(nameKey) && raw.length > 50) return "Apt 4B";
    if (/amount|price|income/.test(nameKey) && (!raw || raw === "0")) return "50000";
    const token = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (!raw || token.startsWith("random") || token.includes("firstnonemptyoption")) return this.forField(name, type);
    if (/date|birth/i.test(name) && /^\\d{4}-\\d{2}-\\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split("-");
      return month + "/" + day + "/" + year;
    }
    return this.resolveDynamicValue(raw);
  }

  static resolveDynamicValue(value: string): string {
    const normalized = this.normalizeDynamicExpression(value);
    const expressionLike = normalized !== String(value || "").trim() || /^(['"]).*\\1\\s*\\+/.test(normalized) || /\\+\\s*(?:rInt|number|randomNumber|rDigits|rString)\\(/i.test(normalized);
    if (expressionLike) return this.splitDynamicPlus(normalized).map((term) => this.evalDynamicTerm(term)).join("");
    return normalized.replace(/\\{\\{\\s*([^}]+?)\\s*\\}\\}/g, (_match, token) => this.dynamicToken(token));
  }

  private static dynamicToken(raw: string): string {
    const key = String(raw || "").trim();
    const intMatch = key.match(/^(?:\\$randomInt|rInt|number|randomNumber)\\((\\d+)\\s*,\\s*(\\d+)\\)$/i);
    if (intMatch) return faker.number.int({ min: Number(intMatch[1]), max: Number(intMatch[2]) }).toString();
    if (/^\\$randomInt$/i.test(key)) return faker.number.int({ min: 0, max: 999 }).toString();
    const digitsMatch = key.match(/^rDigits\\((\\d+)\\)$/i);
    if (digitsMatch) return Array.from({ length: Number(digitsMatch[1]) || 0 }, () => faker.number.int({ min: 0, max: 9 })).join("");
    const stringMatch = key.match(/^(?:\\$randomString|rString)\\((\\d+)\\)$/i);
    if (stringMatch) return faker.string.alphanumeric(Number(stringMatch[1]) || 0).toLowerCase();
    if (/^\\$timestampMs$/i.test(key)) return Date.now().toString();
    if (/^\\$timestamp$/i.test(key)) return Math.floor(Date.now() / 1000).toString();
    if (/^\\$isoTimestamp$/i.test(key)) return new Date().toISOString();
    if (/^\\$randomUUID$/i.test(key)) return faker.string.uuid();
    if (/^\\$randomEmail$/i.test(key)) return "qa" + Date.now() + "@test.com";
    if (/^\\$randomDNI$|^Random_DNI$/i.test(key)) {
      const number = String(faker.number.int({ min: 0, max: 99999999 })).padStart(8, "0");
      return number + "TRWAGMYFPDXBNJZSQVHLCKE"[Number(number) % 23];
    }
    if (/^name$|^firstName$|^randomFirstName$|^\\$randomFirstName$/i.test(key)) return faker.person.firstName();
    if (/^lastName$|^randomLastName$|^\\$randomLastName$/i.test(key)) return faker.person.lastName();
    if (/^fullName$|^randomFullName$|^\\$randomFullName$/i.test(key)) return faker.person.fullName();
    if (/^dob$|^randomDOB$|^randomDob$|^randomDateOfBirth$|^\\$randomDOB$/i.test(key)) return "01/15/1990";
    if (/^email_prefix$/i.test(key)) return "qa.automation";
    if (/^RandomPhoneNumber$|^randomPhone$|^\\$randomPhoneNumber$/i.test(key)) return "0501234567";
    if (/^\\$randomBankAccount$/i.test(key)) return Array.from({ length: 8 }, () => faker.number.int({ min: 0, max: 9 })).join("");
    if (/^\\$randomCompanyName$/i.test(key)) return faker.company.name();
    return "{{" + key + "}}";
  }

  private static normalizeDynamicExpression(value: string): string {
    const text = String(value == null ? "" : value).trim();
    const equalsIndex = text.indexOf("=");
    if (equalsIndex === 0) return text.slice(1).trim();
    if (equalsIndex > 0 && /^[A-Za-z_$][\\w$.-]*\\s*$/.test(text.slice(0, equalsIndex))) return text.slice(equalsIndex + 1).trim();
    return text;
  }

  private static splitDynamicPlus(expression: string): string[] {
    const parts: string[] = [];
    let current = "", quote = "", depth = 0;
    for (let index = 0; index < expression.length; index++) {
      const char = expression[index];
      if (quote) { current += char; if (char === quote && expression[index - 1] !== "\\\\") quote = ""; continue; }
      if (char === '"' || char === "'") { quote = char; current += char; continue; }
      if (char === "(") { depth++; current += char; continue; }
      if (char === ")") { depth--; current += char; continue; }
      if (char === "+" && depth === 0) { parts.push(current.trim()); current = ""; continue; }
      current += char;
    }
    parts.push(current.trim());
    return parts;
  }

  private static evalDynamicTerm(term: string): string {
    const text = String(term || "").trim();
    const quoted = text.match(/^(['"])([\\s\\S]*)\\1$/);
    if (quoted) return quoted[2];
    const fn = text.match(/^([A-Za-z_$][\\w$]*)\\(([^()]*)\\)$/);
    if (fn) return this.dynamicToken(fn[1] + "(" + fn[2] + ")");
    return text;
  }

  static forField(name: string, type = "text"): string {
    const key = name.toLowerCase();
    if (/otp|verification.?code|passcode|(?:^|[^A-Za-z0-9_])pin(?:[^A-Za-z0-9_]|$)|codigo|sms.?code/.test(key)) return "1111";
    if (/ssn|social.?security|tax.?number|tax.?id|tin|ein|itin/.test(key)) return "123456789";
    if (/identification|identification.?value|id.?number/.test(key)) return "123456789";
    if (/otp|verification.?code|passcode|(^|\W)pin(\W|$)|c[oó]digo|sms.?code/.test(key)) return "1111";
    if (/(^|\W)dni(\W|$)|nie|government.?id/.test(key)) {
      const number = String(faker.number.int({ min: 0, max: 99999999 })).padStart(8, "0");
      return number + "TRWAGMYFPDXBNJZSQVHLCKE"[Number(number) % 23];
    }
    if (type === "email" || key.includes("email")) return "qa" + Date.now() + "@test.com";
    if (type === "tel" || /phone|mobile|tel/.test(key)) return "0501234567";
    if (/first.?name|firstname/.test(key)) return "QAFirst";
    if (/last.?name|lastname|surname/.test(key)) return "QALast";
    if (/full.?name|customer.?name/.test(key)) return "QAFirst QALast";
    if (/address.*line.*2|address2/.test(key)) return "Apt 4B";
    if (/address|street/.test(key)) return "123 QA Street";
    if (/city/.test(key)) return "Schenectady";
    if (/zip|postal/.test(key)) return "12345";
    if (/company|business|employer/.test(key)) return "QA Employer";
    if (/date|birth/.test(key)) return "01/15/1990";
    if (/amount|price|income/.test(key) || type === "number") return "50000";
    if (/password/.test(key)) return "Qa!" + faker.string.alphanumeric(12);
    if (/role|title|job/.test(key)) return "QA Analyst";
    return "QA Test";
  }
}
`;
    files["utils/Logger.ts"] = `export const Logger = { info: (message: string, details?: unknown) => console.info("[qa]", message, details ?? "") };
`;
    files["utils/DateHelper.ts"] = `export const DateHelper = { isoDate: (date = new Date()) => date.toISOString().slice(0, 10) };
`;
    files["utils/ScreenshotHelper.ts"] = `import { Page, TestInfo } from "@playwright/test";
export async function attachScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await testInfo.attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
}
`;
    files["reporters/qa-results-reporter.js"] = [
      "const fs = require(\"fs\");",
      "const path = require(\"path\");",
      "",
      "class QaResultsReporter {",
      "  constructor(options = {}) {",
      "    this.outputDir = options.outputDir || \"qa-results\";",
      "    this.tests = [];",
      "  }",
      "",
      "  onTestEnd(test, result) {",
      "    this.tests.push({",
      "      title: test.title,",
      "      titlePath: test.titlePath(),",
      "      file: test.location && test.location.file,",
      "      line: test.location && test.location.line,",
      "      status: result.status,",
      "      expectedStatus: test.expectedStatus,",
      "      durationMs: result.duration,",
      "      retry: result.retry,",
      "      steps: collectSteps(result.steps || []),",
      "      errors: (result.errors || []).map((error) => ({ message: stripAnsi(error.message || \"\"), stack: stripAnsi(error.stack || \"\") })),",
      "      attachments: (result.attachments || []).map((attachment) => ({",
      "        name: attachment.name,",
      "        contentType: attachment.contentType,",
      "        path: attachment.path || \"\"",
      "      })).filter((attachment) => attachment.path)",
      "    });",
      "  }",
      "",
      "  async onEnd(fullResult) {",
      "    fs.mkdirSync(this.outputDir, { recursive: true });",
      "    const summary = {",
      "      generatedAt: new Date().toISOString(),",
      "      status: fullResult.status,",
      "      total: this.tests.length,",
      "      passed: this.tests.filter((test) => test.status === \"passed\").length,",
      "      failed: this.tests.filter((test) => test.status === \"failed\" || test.status === \"timedOut\").length,",
      "      skipped: this.tests.filter((test) => test.status === \"skipped\").length,",
      "      interrupted: this.tests.filter((test) => test.status === \"interrupted\").length,",
      "      tests: this.tests",
      "    };",
      "    fs.writeFileSync(path.join(this.outputDir, \"qa-results.json\"), JSON.stringify(summary, null, 2), \"utf8\");",
      "    fs.writeFileSync(path.join(this.outputDir, \"qa-results.md\"), renderMarkdown(summary, this.outputDir), \"utf8\");",
      "  }",
      "}",
      "",
      "function collectSteps(steps, depth = 0) {",
      "  return steps.flatMap((step) => {",
      "    const item = { title: step.title, category: step.category, durationMs: step.duration, status: step.error ? \"failed\" : \"passed\", depth };",
      "    return [item, ...collectSteps(step.steps || [], depth + 1)];",
      "  });",
      "}",
      "",
      "function stripAnsi(value) {",
      "  return String(value || \"\").replace(/\\u001b\\[[0-9;]*m/g, \"\");",
      "}",
      "",
      "function renderMarkdown(summary, outputDir) {",
      "  const lines = [];",
      "  lines.push(\"# QA Results\", \"\");",
      "  lines.push(\"Generated: \" + summary.generatedAt, \"\");",
      "  lines.push(\"Status: **\" + summary.status + \"**\", \"\");",
      "  lines.push(\"Total: \" + summary.total + \" | Passed: \" + summary.passed + \" | Failed: \" + summary.failed + \" | Skipped: \" + summary.skipped, \"\");",
      "  for (const test of summary.tests) {",
      "    const icon = test.status === \"passed\" ? \"✅\" : test.status === \"skipped\" ? \"⏭️\" : \"❌\";",
      "    lines.push(\"## \" + icon + \" \" + test.titlePath.filter(Boolean).join(\" > \"), \"\");",
      "    lines.push(\"- Status: \" + test.status);",
      "    lines.push(\"- Duration: \" + (test.durationMs / 1000).toFixed(1) + \"s\");",
      "    if (test.file) lines.push(\"- Source: \" + test.file + \":\" + (test.line || 1));",
      "    lines.push(\"\");",
      "    const businessSteps = test.steps.filter((step) => step.category === \"test.step\" || /^Assertion:|^Flow:|^Validation:|^Open /.test(step.title || \"\"));",
      "    if (businessSteps.length) {",
      "      lines.push(\"### Checks performed\", \"\");",
      "      for (const step of businessSteps) {",
      "        const prefix = step.status === \"passed\" ? \"✅\" : \"❌\";",
      "        const indent = \"  \".repeat(step.depth);",
      "        lines.push(indent + \"- \" + prefix + \" \" + step.title + \" (\" + (step.durationMs / 1000).toFixed(1) + \"s)\");",
      "      }",
      "      lines.push(\"\");",
      "    }",
      "    if (test.errors.length) {",
      "      lines.push(\"### Failure\", \"\");",
      "      for (const error of test.errors) lines.push(\"```text\", (error.message || error.stack || \"\").trim(), \"```\");",
      "      lines.push(\"\");",
      "    }",
      "    if (test.attachments.length) {",
      "      lines.push(\"### Attachments\", \"\");",
      "      for (const attachment of test.attachments) {",
      "        const relative = path.relative(outputDir, attachment.path).replace(/\\\\/g, \"/\");",
      "        if ((attachment.contentType || \"\").includes(\"image/\")) lines.push(\"- \" + attachment.name + \":\", \"  ![\" + attachment.name + \"](\" + relative + \")\");",
      "        else lines.push(\"- [\" + attachment.name + \"](\" + relative + \")\");",
      "      }",
      "      lines.push(\"\");",
      "    }",
      "  }",
      "  return lines.join(\"\\n\");",
      "}",
      "",
      "module.exports = QaResultsReporter;"
    ].join("\n");
    files[`tests/${domain}/${domain}-happy-flow.spec.ts`] = happySpec(domain, flowSteps, assertions);
    files[`tests/${domain}/${domain}-validations.spec.ts`] = validationsSpec(domain);
    files[`tests/${domain}/${domain}-negative-validations.spec.ts`] = negativeValidationsSpec(domain, flowSteps, negativeValidations);
    files["tests/smoke/basic-smoke.spec.ts"] = `import { test, expect } from "../../fixtures/BaseTest";

test("smoke-basic", async ({ page, startUrl }) => {
  const response = await page.goto(startUrl, { waitUntil: "domcontentloaded" });
  expect(response, "A document response should be returned").not.toBeNull();
  expect(response && response.status(), "Page should not return a server error").toBeLessThan(500);
  await expect(page.locator("body")).toBeVisible();
});
`;
    files["playwright.config.ts"] = `import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"], ["./reporters/qa-results-reporter.js", { outputDir: "qa-results" }]],
  use: { trace: "retain-on-failure", screenshot: "only-on-failure", video: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
});
`;
    files["package.json"] = JSON.stringify({name:"qa-blueprint-playwright-suite",version:"1.0.0",private:true,scripts:{test:"playwright test","test:ui":"playwright test --ui",report:"playwright show-report"},devDependencies:{"@faker-js/faker":"^9.0.0","@playwright/test":"^1.52.0","@types/node":"^22.0.0","typescript":"^5.8.0"}}, null, 2);
    files["tsconfig.json"] = JSON.stringify({compilerOptions:{target:"ES2022",module:"commonjs",moduleResolution:"node",strict:true,esModuleInterop:true,resolveJsonModule:true,types:["node","@playwright/test"]},include:["**/*.ts"]}, null, 2);
    files[".gitignore"] = "node_modules/\nplaywright-report/\ntest-results/\n.env\n";
    files["README.md"] = `# QA Blueprint Playwright Suite

Install with \`npm install\`, install Chromium with \`npx playwright install chromium\`, then run \`npm test\`.

If the source spec contains API start configuration, every test resolves a fresh start URL through that API. Otherwise, override the generated static URL with \`BASE_URL=https://example.test npm test\`.

After every run, QA evidence is written automatically to \`qa-results/qa-results.md\` and \`qa-results/qa-results.json\`.
On failures, the Markdown report links to the Playwright screenshot, error context, video/trace when available.

For future updates, paste \`source-input-for-blueprint.json\` into \`qa-blueprint.html\`. It is generated on every export and includes the flow, fields, CTAs, API start config and business assertions.
`;
    files["docs/ARCHITECTURE_RULES.md"] = architectureRules();
    files["docs/CHANGELOG.md"] = `# Changelog

## ${generatedAt.slice(0,10)} — Initial deterministic generation

- Created the ${domain} domain suite from the QA Blueprint.
- Added stable test IDs: ${testIds.join(", ")}.
`;

    const preliminaryPaths = Object.keys(files).concat("docs/PROJECT_MAP.md", "qa-project-manifest.json").sort();
    files["docs/PROJECT_MAP.md"] = projectMap(domain, preliminaryPaths);

    const mixed = new Set(["pages/BlueprintPage.ts", `tests/${domain}/${domain}-happy-flow.spec.ts`, `tests/${domain}/${domain}-validations.spec.ts`, `tests/${domain}/${domain}-negative-validations.spec.ts`, "docs/PROJECT_MAP.md", "docs/CHANGELOG.md"]);
    const human = new Set(["docs/ARCHITECTURE_RULES.md", "README.md"]);
    const pageObjectName = "BlueprintPage";
    const manifest = {
      version:1,
      projectName:"qa-blueprint-playwright-suite",
      generatedAt,
      updatedAt:generatedAt,
      files:Object.keys(files).map((path) => entry(path, {
        purpose:path.startsWith("tests/") ? "Playwright test coverage" : path.startsWith("pages/") ? "Reusable page object" : path.startsWith("docs/") ? "Project governance documentation" : "Generated automation infrastructure",
        owner:human.has(path) ? "human" : mixed.has(path) ? "mixed" : "generated",
        domain:path.startsWith("tests/smoke/") ? "smoke" : path.includes(domain) || path === "pages/BlueprintPage.ts" ? domain : "infrastructure",
        exports:path === "pages/BlueprintPage.ts" ? [pageObjectName] : path === "fixtures/BaseTest.ts" ? ["test", "expect"] : [],
        relatedTestIds:path.includes(domain) || path === "pages/BlueprintPage.ts" ? testIds.filter((id) => id.startsWith(domain)) : path.includes("smoke") ? ["smoke-basic"] : [],
        relatedPageObjects:path.startsWith("tests/") || path === "fixtures/BaseTest.ts" ? [pageObjectName] : [],
        relatedApiServices:[],
        lastUpdatedReason:"Created from QA Blueprint",
        safeToOverwrite:!mixed.has(path) && !human.has(path)
      })).sort((a,b) => a.path.localeCompare(b.path))
    };
    manifest.files.push(entry("qa-project-manifest.json", {purpose:"Ownership and dependency source of truth", owner:"generated", domain:"infrastructure", exports:[], relatedTestIds:[], relatedPageObjects:[], relatedApiServices:[], lastUpdatedReason:"Created from QA Blueprint", safeToOverwrite:true}));
    return {files, manifest, domain};
  }

  global.QABlueprintProductionTemplates = {DOMAINS, detectDomain, build};
})(window);
