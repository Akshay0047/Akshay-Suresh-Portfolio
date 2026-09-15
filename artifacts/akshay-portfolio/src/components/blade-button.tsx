import { AnimatePresence, motion } from 'framer-motion';
import { type ButtonHTMLAttributes, type MouseEvent, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

type Spark = {
  id: number;
  x: number;
  y: number;
  scale: number;
};

export type BladeButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

export function BladeButton({
  className,
  children,
  onClick,
  onMouseDown,
  type = 'button',
  ...props
}: BladeButtonProps) {
  const [sparks, setSparks] = useState<Spark[]>([]);

  const removeSpark = useCallback((id: number) => {
    setSparks((current) => current.filter((item) => item.id !== id));
  }, []);

  const handleMouseDown = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const spark: Spark = {
      id: window.performance.now() + Math.random(),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      scale: 2 + Math.random(),
    };

    setSparks((current) => [...current, spark]);
    onMouseDown?.(event);
  };

  return (
    <button
      type={type}
      className={cn('blade-button group relative overflow-hidden', className)}
      onMouseDown={handleMouseDown}
      onClick={onClick}
      {...props}
    >
      <span className="blade-button-slash" aria-hidden="true" />
      <AnimatePresence>
        {sparks.map((spark) => (
          <motion.span
            key={spark.id}
            className="blade-button-spark"
            style={{ left: spark.x, top: spark.y }}
            initial={{ scale: 0, opacity: 1, x: '-50%', y: '-50%' }}
            animate={{ scale: spark.scale, opacity: 0, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: spark.scale, x: '-50%', y: '-50%' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onAnimationComplete={() => removeSpark(spark.id)}
            aria-hidden="true"
          />
        ))}
      </AnimatePresence>
      {children}
    </button>
  );
}
