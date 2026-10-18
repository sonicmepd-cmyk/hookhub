'use client';

import React from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { cn } from '@/lib/utils';

// Props interface for the component
interface AnimatedMarqueeHeroProps {
  tagline: string;
  title: React.ReactNode;
  description: string;
  ctaText: string;
  ctaHref: string;
  images: string[];
  className?: string;
}

// Botón de acción (enlace real, no botón muerto) con la paleta HookHub
const ActionButton = ({ children, href }: { children: React.ReactNode; href: string }) => (
  <motion.a
    href={href}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
  >
    {children}
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M8 2v10M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>
    </svg>
  </motion.a>
);

// Secuencia de entrada de textos
const FADE_IN_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 20 } },
};

// El componente principal (usado como sección de cierre, no como h1 de la página)
export const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  tagline,
  title,
  description,
  ctaText,
  ctaHref,
  images,
  className,
}) => {
  // Imágenes duplicadas para un bucle continuo
  const duplicatedImages = [...images, ...images];

  return (
    <MotionConfig reducedMotion="user">
      <section
        className={cn(
          'relative w-full overflow-hidden bg-background text-center px-4',
          className
        )}
        aria-label="Llamada final a la acción"
      >
        <div className="z-10 flex flex-col items-center pt-16 md:pt-24">
          {/* Etiqueta superior */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={FADE_IN_ANIMATION_VARIANTS}
            className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm"
          >
            {tagline}
          </motion.div>

          {/* Título principal de la sección */}
          <motion.h2
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.1 } },
            }}
            className="text-4xl md:text-6xl font-bold tracking-tight text-foreground"
          >
            {typeof title === 'string'
              ? title.split(' ').map((word, i) => (
                  <motion.span key={i} variants={FADE_IN_ANIMATION_VARIANTS} className="inline-block">
                    {word}&nbsp;
                  </motion.span>
                ))
              : title}
          </motion.h2>

          {/* Descripción */}
          <motion.p
            initial="hidden"
            animate="show"
            variants={FADE_IN_ANIMATION_VARIANTS}
            transition={{ delay: 0.5 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            {description}
          </motion.p>

          {/* Llamada a la acción */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={FADE_IN_ANIMATION_VARIANTS}
            transition={{ delay: 0.6 }}
          >
            <ActionButton href={ctaHref}>{ctaText}</ActionButton>
          </motion.div>
        </div>

        {/* Marquesina de imágenes (placeholders locales abstractos, sin CDN externo) */}
        <div
          className="absolute bottom-0 left-0 w-full h-1/3 md:h-2/5 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
          aria-hidden="true"
        >
          <motion.div
            className="flex gap-4 px-4"
            animate={{
              x: ['-100%', '0%'],
              transition: { ease: 'linear', duration: 40, repeat: Infinity },
            }}
          >
            {duplicatedImages.map((src, index) => (
              <div
                key={index}
                className="relative aspect-[3/4] h-48 md:h-64 shrink-0"
                style={{ rotate: `${index % 2 === 0 ? -2 : 5}deg` }}
              >
                <img
                  src={src}
                  alt=""
                  decoding="async"
                  className="w-full h-full object-cover rounded-2xl shadow-md"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
};

export default AnimatedMarqueeHero;
