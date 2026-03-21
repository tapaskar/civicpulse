import { Suspense } from 'react';
import { ReportForm } from '@/components/ReportForm';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Report Issue',
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
