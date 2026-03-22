import { SocietyProvider } from '@/components/society/SocietyProvider';

export default async function SocietyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SocietyProvider slug={slug}>{children}</SocietyProvider>;
}
