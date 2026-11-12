import Link from "next/link";
import { createItem } from "@/actions";
import { getContext } from "@/lib/context";
import { AppShell } from "@/components/AppShell";
import { NewItemForm } from "./NewItemForm";

export default async function NewItem() {
  const ctx = await getContext();

  return <AppShell household={ctx.household.name} title="Kleidungsstück erfassen">
    <NewItemForm householdName={ctx.household.name} />
  </AppShell>;
}