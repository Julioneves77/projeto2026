import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ 
  progress, 
  showPercentage = true, 
  animated = true,
  size = 'md' 
}: ProgressBarProps) {
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      <div className={`w-full bg-secondary rounded-full overflow-hidden ${heights[size]}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
          className={`${heights[size]} rounded-full gradient-primary relative overflow-hidden`}
        >
          {animated && progress > 0 && progress < 100 && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent animate-shimmer"
              style={{ backgroundSize: '200% 100%' }}
            />
          )}
        </motion.div>
      </div>
      {showPercentage && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-end mt-1"
        >
          <span className="text-[10px] font-medium text-muted-foreground">
            {Math.round(progress)}% concluído
          </span>
        </motion.div>
      )}
    </div>
  );
}
