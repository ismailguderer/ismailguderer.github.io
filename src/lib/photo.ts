import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';
import { cv } from './cv';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/*.{jpg,jpeg,png,webp}', { eager: true });

/** Portrait named by person.photo in cv.yaml, looked up in src/assets. */
export const photo = cv.person.photo ? files[`../assets/${cv.person.photo}`]?.default ?? null : null;
if (cv.person.photo && !photo) throw new Error(`cv.yaml > person.photo: src/assets/${cv.person.photo} not found`);

/** Square JPEG of the portrait for link previews and structured data. */
export const sharePhoto = photo ? await getImage({ src: photo, width: 800, height: 800, format: 'jpeg' }) : null;
