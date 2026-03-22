import { redirect } from 'next/navigation';

export default async function SocietyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/society/${slug}/map`);
}
