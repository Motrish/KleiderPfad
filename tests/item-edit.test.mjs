import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const id = "b0e9904c-ef16-49a9-9c31-41461075b8aa";

function loadPage(path, mocks) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true,
  });
  assert.equal(diagnostics.length, 0);
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)(
    name => name in mocks ? mocks[name] : require(name), module, module.exports,
  );
  return module.exports.default;
}

function elements(node) {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}

async function detail({ edit, own = true } = {}) {
  const query = { from: () => query, where: () => query, orderBy: () => [] };
  query.then = resolve => resolve([]);
  const Page = loadPage("../src/app/wardrobe/[id]/page.tsx", {
    "@/lib/context": { getContext: async () => ({ household: { id: "home", name: "Home" } }) },
    "@/lib/access": { getVisibleItem: async () => ({ id, title: "Jacke", condition: "good", sizeLabel: "92", ownerHouseholdId: own ? "home" : "other", holderHouseholdId: "home" }) },
    "@/lib/db": { db: { select: () => query } },
    "@/db/schema": { itemPhotos: {}, itemEvents: {}, transfers: {}, households: {}, categories: {} },
    "@/actions": { updateItem() {}, archiveItem() {} },
    "@/components/AppShell": { AppShell: "app-shell" },
    "@/components/AddPhotoSection": { AddPhotoSection: "add-photo" },
    "next/link": "a",
  });
  return elements(await Page({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ edit }) }));
}

test("legacy edit URL opens the existing editor", async () => {
  const Page = loadPage("../src/app/wardrobe/[id]/edit/page.tsx", {
    "next/navigation": { redirect: path => { throw new Error(path); } },
  });
  await assert.rejects(Page({ params: Promise.resolve({ id }) }), {
    message: `/wardrobe/${id}?edit=1#edit`,
  });
});

test("item actions include editing and no inactive More button", async () => {
  const nodes = await detail();
  const bar = nodes.find(n => n.props?.className === "action-bar");
  assert.ok(elements(bar).some(n => n.props?.href === `/wardrobe/${id}?edit=1#edit`));
  assert.ok(!nodes.some(n => n.props?.["aria-label"] === "Mehr"));
});

test("edit navigation expands the form; non-owned items cannot edit", async () => {
  const nodes = await detail({ edit: "1" });
  assert.equal(nodes.find(n => n.type === "details" && n.props.id === "edit")?.props.open, true);
  const other = await detail({ edit: "1", own: false });
  assert.ok(!other.some(n => n.type === "details" && n.props.id === "edit"));
  assert.ok(!other.some(n => n.props?.href?.includes("?edit=")));
});
