import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

// Dynamically import the client-side comparison component without SSR
const CarComparisonClient = dynamicImport(
  () => import('@/components/comparison/CarComparisonClient'),
  { ssr: false }
);

export default function Page() {
  return <CarComparisonClient />;
}