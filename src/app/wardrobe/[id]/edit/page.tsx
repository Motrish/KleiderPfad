import { redirect } from "next/navigation";

export default async function EditItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/wardrobe/${encodeURIComponent(id)}?edit=1#edit`);
}
