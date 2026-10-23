/**
 * Monitored zones — Issue #672
 *
 * A project becomes a "monitored zone" when it carries a forest protection
 * buffer zone (`AdminProjectDetail.bufferZone`, issue #1714). The buffer
 * polygon is the area we watch for canopy loss.
 */

import { mockAdminProjectDetails } from '@/lib/api/mock/adminProjectDetails';
import { centroid, closeRing, type Ring } from './geometry';
import type { MonitoredZone } from './types';

/** Buffer polygons with fewer than 3 vertices cannot be monitored. */
const MIN_ZONE_VERTICES = 3;

/**
 * Every project with a usable forest protection buffer polygon is monitored
 * for deforestation alerts.
 */
export function getMonitoredZones(): MonitoredZone[] {
  const zones: MonitoredZone[] = [];

  for (const project of mockAdminProjectDetails) {
    const buffer = project.bufferZone;
    const polygon = buffer?.polygonCoordinates;
    if (!polygon || polygon.length < MIN_ZONE_VERTICES) continue;

    const ring: Ring = closeRing(polygon.map(([lng, lat]) => [lng, lat] as [number, number]));

    zones.push({
      zoneId: `zone-${project.id}`,
      projectId: project.id,
      projectName: project.name,
      areaHectares: buffer.areaHectares,
      polygon: ring,
      center: centroid(ring),
    });
  }

  return zones;
}

export function getMonitoredZoneForProject(projectId: string): MonitoredZone | null {
  return getMonitoredZones().find((zone) => zone.projectId === projectId) ?? null;
}
