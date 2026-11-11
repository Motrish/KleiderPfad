export function value(form: FormData, key: string, max = 255) {
  const raw = form.get(key);
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

export function required(form: FormData, key: string, max = 255) {
  const result = value(form, key, max);
  if (!result) throw new Error("Pflichtfeld fehlt: " + key);
  return result;
}

export function uuid(s: string) {
  if (!/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(s)) {
    throw new Error("Ungültige ID");
  }
  return s;
}
