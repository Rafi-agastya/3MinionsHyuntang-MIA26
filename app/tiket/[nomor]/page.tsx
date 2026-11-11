import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ nomor: string }>;
}

export default async function TiketNomorAliasPage({ params }: PageProps) {
  const { nomor } = await params;
  redirect(`/aduan/lacak?nomor=${encodeURIComponent(nomor)}`);
}

