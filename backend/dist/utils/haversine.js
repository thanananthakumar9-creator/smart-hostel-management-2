"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHaversineDistance = calculateHaversineDistance;
exports.verifyGeofence = verifyGeofence;
/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in meters
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radius of Earth in meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
}
function toRadians(degrees) {
    return (degrees * Math.PI) / 180;
}
/**
 * Checks whether a student's coordinate falls inside the configured hostel boundary.
 */
function verifyGeofence(studentLat, studentLon, hostelLat, hostelLon, allowedRadiusMeters) {
    const distanceMeters = calculateHaversineDistance(studentLat, studentLon, hostelLat, hostelLon);
    const isInside = distanceMeters <= allowedRadiusMeters;
    const marginMeters = Math.round((allowedRadiusMeters - distanceMeters) * 100) / 100;
    return {
        isInside,
        distanceMeters,
        allowedRadiusMeters,
        marginMeters,
    };
}
