import L from 'leaflet';
import 'leaflet.heat';

export type HeatLayerPoint = [number, number, number?];

export interface HeatLayerOptions {
  minOpacity?: number;
  maxZoom?: number;
  max?: number;
  radius?: number;
  blur?: number;
  gradient?: Record<number, string>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BaseHeatLayer = (L as any).HeatLayer;

/**
 * leaflet.heat draws kernels on a canvas sized exactly to the map viewport.
 * Large radius/blur values get clipped at the edges, which looks like quarter circles.
 * Pad the canvas by the kernel radius so blobs render fully.
 */
const PaddedHeatLayer = BaseHeatLayer.extend({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _reset(this: any) {
    const pad = this._heat._r;
    const topLeft = this._map.containerPointToLayerPoint(L.point(-pad, -pad));
    L.DomUtil.setPosition(this._canvas, topLeft);

    const size = this._map.getSize();
    const width = size.x + pad * 2;
    const height = size.y + pad * 2;

    if (this._heat._width !== width) {
      this._canvas.width = this._heat._width = width;
    }
    if (this._heat._height !== height) {
      this._canvas.height = this._heat._height = height;
    }

    this._redraw();
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _redraw(this: any) {
    if (!this._map) return;

    const pad = this._heat._r;
    const data: number[][] = [];
    const kernelRadius = this._heat._r;
    const size = this._map.getSize();
    const bounds = new L.Bounds(L.point([-kernelRadius, -kernelRadius]), size.add([kernelRadius, kernelRadius]));

    const max = this.options.max ?? 1;
    const maxZoom = this.options.maxZoom ?? this._map.getMaxZoom();
    const zoomIntensity = 1 / Math.pow(2, Math.max(0, Math.min(maxZoom - this._map.getZoom(), 12)));
    const cellSize = kernelRadius / 2;
    const grid: Array<Array<[number, number, number] | undefined>> = [];
    const panePos = this._map._getMapPanePos();
    const offsetX = panePos.x % cellSize;
    const offsetY = panePos.y % cellSize;

    for (let i = 0; i < this._latlngs.length; i++) {
      const point = this._map.latLngToContainerPoint(this._latlngs[i]);
      if (!bounds.contains(point)) continue;

      const x = Math.floor((point.x - offsetX) / cellSize) + 2;
      const y = Math.floor((point.y - offsetY) / cellSize) + 2;
      const latlng = this._latlngs[i];
      const intensity =
        latlng.alt !== undefined ? latlng.alt : latlng[2] !== undefined ? +latlng[2] : 1;
      const weightedIntensity = intensity * zoomIntensity;

      grid[y] = grid[y] || [];
      const cell = grid[y][x];

      if (!cell) {
        grid[y][x] = [point.x, point.y, weightedIntensity];
      } else {
        cell[0] = (cell[0] * cell[2] + point.x * weightedIntensity) / (cell[2] + weightedIntensity);
        cell[1] = (cell[1] * cell[2] + point.y * weightedIntensity) / (cell[2] + weightedIntensity);
        cell[2] += weightedIntensity;
      }
    }

    for (let row = 0; row < grid.length; row++) {
      const gridRow = grid[row];
      if (!gridRow) continue;

      for (let col = 0; col < gridRow.length; col++) {
        const cell = gridRow[col];
        if (!cell) continue;

        data.push([
          Math.round(cell[0] + pad),
          Math.round(cell[1] + pad),
          Math.min(cell[2], max),
        ]);
      }
    }

    this._heat.data(data).draw(this.options.minOpacity);
    this._frame = null;
  },
});

export function createHeatLayer(points: HeatLayerPoint[], options?: HeatLayerOptions): L.Layer {
  return new PaddedHeatLayer(points, options);
}
