import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClasses = getStatusColor(status);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}>
      {getStatusLabel(status)}
    </span>
  );
}
