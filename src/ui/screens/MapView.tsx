import { useEffect, useRef } from 'preact/hooks';
import { LOCATIONS } from '@/content/locations';
import { NPCS } from '@/content/npcs';
import { textContext } from '@/game/engine';
import { fortressMap, type MapPlace } from '@/game/map';
import type { Session } from '@/game/types';
import { useI18n } from '../i18n';
import { useStore } from '../store';

interface Props {
  session: Session;
  onClose: () => void;
}

/**
 * Карта крепости: известные места и дороги между ними, где герой, кто из знакомых где сейчас.
 * Щелчок по месту ведёт туда самым быстрым путём (только при свободном перемещении).
 * Закрывается M или Esc.
 */
export function MapView({ session, onClose }: Props) {
  const store = useStore();
  const { t, name, label } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);

  const { places, roads } = fortressMap(session);
  const ctx = textContext(session);
  const roaming = session.sceneId === null;
  const at = (id: string) => places.find((place) => place.id === id);

  function go(place: MapPlace) {
    if (!roaming || place.minutes === null) return;
    onClose();
    store.choose({ text: { id: 'travel', to: place.id }, travel: place.id });
  }

  return (
    <div class="menu journal map" role="dialog" aria-label={t.map.title}>
      <div class="journal__inner">
        <header class="journal__header">
          <h1>{t.map.title}</h1>
          <button ref={closeRef} class="journal__close" title={t.closeEsc} onClick={onClose}>
            ✕
          </button>
        </header>
        <p class="journal__empty">{roaming ? t.map.legend : t.map.busy}</p>
        <svg class="fortress-map" viewBox="0 0 100 82" role="group" aria-label={t.map.title}>
          {roads.map((road) => {
            const from = at(road.from);
            const to = at(road.to);
            if (!from || !to) return null;
            return (
              <line
                key={road.from + road.to}
                class={'map-road' + (road.open ? '' : ' map-road--locked')}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
              />
            );
          })}
          {places.map((place) => {
            const reachable = roaming && place.minutes !== null;
            const status = place.here
              ? t.map.here
              : place.minutes !== null
                ? t.map.minutes(place.minutes)
                : t.map.locked;
            const hint = place.locked ? label(place.locked, ctx) : null;
            const placeName = name(LOCATIONS[place.id].name);
            return (
              <g
                key={place.id}
                class={
                  'map-place' +
                  (place.here ? ' map-place--here' : '') +
                  (reachable ? ' map-place--reachable' : '') +
                  (place.minutes === null && !place.here ? ' map-place--locked' : '')
                }
                role={reachable ? 'button' : undefined}
                tabIndex={reachable ? 0 : undefined}
                aria-label={
                  reachable && place.minutes !== null
                    ? t.map.go(placeName, place.minutes)
                    : placeName
                }
                onClick={() => go(place)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    go(place);
                  }
                }}
              >
                <title>{[placeName, status, hint].filter(Boolean).join(' — ')}</title>
                <circle cx={place.x} cy={place.y} r={4} />
                {!place.visited && (
                  <circle class="map-place__new" cx={place.x + 3.2} cy={place.y - 3.2} r={1.1} />
                )}
                <text class="map-place__name" x={place.x} y={place.y + 8}>
                  {placeName}
                </text>
                <text class="map-place__status" x={place.x} y={place.y + 11.5}>
                  {status}
                  {!place.visited && ' · ' + t.map.new}
                </text>
                {place.people.length > 0 && (
                  <text class="map-place__people" x={place.x} y={place.y + 15}>
                    {place.people.map((id) => name(NPCS[id].name)).join(', ')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
