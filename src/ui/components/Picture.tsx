import { useState } from 'preact/hooks';

interface Props {
  src: string;
  alt?: string;
  class?: string;
}

/**
 * Картинка, которая скрывается, если файла нет, — так сцены можно писать раньше,
 * чем для них готов арт. Используйте с key={src}, чтобы состояние сбрасывалось при смене картинки.
 */
export function Picture({ src, alt = '', class: className }: Props) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return <img src={src} alt={alt} class={className} onError={() => setBroken(true)} />;
}
