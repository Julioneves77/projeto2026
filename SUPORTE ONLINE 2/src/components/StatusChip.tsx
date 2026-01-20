import { motion } from 'framer-motion';
import { Check, Clock, Loader2 } from 'lucide-react';

interface StatusChipProps {
  label: string;
  status: 'pending' | 'processing' | 'done';
  delay?: number;
}

export function StatusChip({ label, status, delay = 0 }: StatusChipProps) {
  const variants = {
    pending: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      icon: Clock,
    },
    processing: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      icon: Loader2,
    },
    done: {
      bg: 'bg-success/10',
      text: 'text-success',
      icon: Check,
    },
  };

  const { bg, text, icon: Icon } = variants[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      <Icon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {label}
    </motion.div>
  );
}
