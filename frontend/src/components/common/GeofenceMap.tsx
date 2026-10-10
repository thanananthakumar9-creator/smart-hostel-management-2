import React from 'react';
import { MapPin, Navigation, ShieldCheck, ShieldAlert } from 'lucide-react';

interface GeofenceMapProps {
  hostelName: string;
  hostelLat: number;
  hostelLon: number;
  hostelRadius: number;
  studentLat?: number | null;
  studentLon?: number | null;
  distanceMeters?: number | null;
  isInside?: boolean | null;
}

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
  hostelName,
  hostelLat,
  hostelLon,
  hostelRadius,
  studentLat,
  studentLon,
  distanceMeters,
  isInside,
}) => {
  // Compute normalized relative offsets for canvas visualization
  // 1 degree latitude ~ 111,000 meters.
  // 1 degree longitude ~ 111,000 * cos(lat) meters.
  const latScale = 111000;
  const lonScale = 111000 * Math.cos((hostelLat * Math.PI) / 180);

  // Center is at (175, 175) on a 350x350 SVG viewbox
  const svgCenter = 175;
  const mapExtentMeters = Math.max(hostelRadius * 2.2, (distanceMeters || 0) * 1.3, 220);
  const pixelPerMeter = 140 / mapExtentMeters;

  const geofencePixelRadius = Math.max(25, hostelRadius * pixelPerMeter);

  let studentPixelX = svgCenter;
  let studentPixelY = svgCenter;

  if (studentLat !== undefined && studentLat !== null && studentLon !== undefined && studentLon !== null) {
    const dNorthMeters = (studentLat - hostelLat) * latScale;
    const dEastMeters = (studentLon - hostelLon) * lonScale;

    studentPixelX = svgCenter + dEastMeters * pixelPerMeter;
    studentPixelY = svgCenter - dNorthMeters * pixelPerMeter; // North is up (-Y)

    // Clamp inside SVG viewport
    studentPixelX = Math.max(25, Math.min(325, studentPixelX));
    studentPixelY = Math.max(25, Math.min(325, studentPixelY));
  }

  const hasStudentLocation = studentLat !== null && studentLat !== undefined;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col items-center">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h4 className="font-semibold text-sm text-white flex items-center gap-1.5">
            <Navigation className="w-4 h-4 text-emerald-400" />
            Hostel Geospatial Geofence Visualizer
          </h4>
          <p className="text-xs text-slate-400">
            {hostelName} • Boundary Radius: {hostelRadius}m
          </p>
        </div>
        {hasStudentLocation && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isInside
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}
          >
            {isInside ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" /> Inside Premises ({distanceMeters}m)
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" /> Outside Premises ({distanceMeters}m)
              </>
            )}
          </div>
        )}
      </div>

      <div className="relative w-full max-w-[360px] aspect-square my-4 bg-slate-950/60 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center">
        {/* Subtle Map Grid lines */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 pointer-events-none opacity-20">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border border-slate-700/50" />
          ))}
        </div>

        <svg viewBox="0 0 350 350" className="w-full h-full">
          {/* Outer radar ripple pulses */}
          <circle
            cx={svgCenter}
            cy={svgCenter}
            r={geofencePixelRadius}
            className="fill-emerald-500/10 stroke-emerald-500/40 stroke-1 stroke-dasharray-4"
          />
          <circle
            cx={svgCenter}
            cy={svgCenter}
            r={geofencePixelRadius}
            className="fill-none stroke-emerald-400 stroke-2"
          />

          {/* Line connecting Hostel Center to Student */}
          {hasStudentLocation && (
            <line
              x1={svgCenter}
              y1={svgCenter}
              x2={studentPixelX}
              y2={studentPixelY}
              className={`stroke-2 stroke-dasharray-4 ${
                isInside ? 'stroke-emerald-400' : 'stroke-rose-400'
              }`}
            />
          )}

          {/* Hostel Center Marker */}
          <g transform={`translate(${svgCenter}, ${svgCenter})`}>
            <circle r="12" className="fill-emerald-500/20" />
            <circle r="6" className="fill-emerald-400" />
          </g>

          {/* Student GPS Location Marker */}
          {hasStudentLocation && (
            <g transform={`translate(${studentPixelX}, ${studentPixelY})`}>
              <circle
                r="16"
                className={`animate-ping opacity-30 ${
                  isInside ? 'fill-emerald-400' : 'fill-rose-400'
                }`}
              />
              <circle
                r="10"
                className={`${isInside ? 'fill-emerald-500' : 'fill-rose-500'} stroke-2 stroke-white`}
              />
              <circle r="4" className="fill-white" />
            </g>
          )}
        </svg>

        {/* Overlay Labels */}
        <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur border border-slate-800">
          Center: {hostelLat.toFixed(5)}, {hostelLon.toFixed(5)}
        </div>

        {hasStudentLocation && (
          <div className="absolute top-2 right-3 text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur border border-slate-800">
            GPS: {studentLat?.toFixed(5)}, {studentLon?.toFixed(5)}
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between text-xs text-slate-400 px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          Hostel Geofence ({hostelRadius}m)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
          Student Location Pin
        </span>
      </div>
    </div>
  );
};
