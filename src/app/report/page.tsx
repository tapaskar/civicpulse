import { Suspense } from 'react';
import { ReportForm } from '@/components/ReportForm';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Report a Civic Issue',
  description: 'Report potholes, broken streetlights, water leaks, garbage, and other civic issues in your city. Upload a photo and AI will detect the issue type automatically.',
  alternates: { canonical: '/report' },
  openGraph: {
    title: 'Report a Civic Issue — interns.city',
    description: 'Report civic issues in your city with photo upload and AI detection.',
  },
};

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      }
    >
      <ReportForm />
    </Suspense>
  );
}
