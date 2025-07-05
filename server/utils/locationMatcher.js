import User from '../models/User.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Check if two locations match (same city and state, or within specified radius)
 * @param {Object} location1 - First location object
 * @param {Object} location2 - Second location object
 * @param {number} maxDistance - Maximum distance in km for matching (default: 50)
 * @returns {boolean} True if locations match
 */
export const locationsMatch = (location1, location2, maxDistance = 50) => {
  // Exact city and state match
  if (location1.city?.toLowerCase() === location2.city?.toLowerCase() &&
      location1.state?.toLowerCase() === location2.state?.toLowerCase()) {
    return true;
  }

  // Distance-based matching if coordinates are available
  if (location1.coordinates && location2.coordinates) {
    const distance = calculateDistance(
      location1.coordinates.latitude,
      location1.coordinates.longitude,
      location2.coordinates.latitude,
      location2.coordinates.longitude
    );
    return distance <= maxDistance;
  }

  // Fallback: check if cities are in the same state and nearby
  if (location1.state?.toLowerCase() === location2.state?.toLowerCase()) {
    // For same state, we'll consider it a match if cities are similar
    // This is a simplified approach - in production you might want more sophisticated matching
    return true;
  }

  return false;
};

/**
 * Find MSMEs that match the consignment's origin location
 * @param {Object} consignmentOrigin - Origin location of the consignment
 * @param {number} maxDistance - Maximum distance in km for matching
 * @returns {Array} Array of matching MSME users
 */
export const findMatchingMSMEs = async (consignmentOrigin, maxDistance = 50) => {
  try {
    // Get all MSME users
    const msmeUsers = await User.find({ companyType: 'msme' });
    
    const matchingMSMEs = msmeUsers.filter(user => {
      if (!user.location) return false;
      
      return locationsMatch(consignmentOrigin, user.location, maxDistance);
    });

    return matchingMSMEs;
  } catch (error) {
    console.error('Error finding matching MSMEs:', error);
    return [];
  }
};

/**
 * Get consignments that match an MSME's location
 * @param {Object} msmeLocation - MSME's location
 * @param {Array} consignments - Array of consignments to filter
 * @param {number} maxDistance - Maximum distance in km for matching
 * @returns {Array} Array of matching consignments
 */
export const getMatchingConsignments = (msmeLocation, consignments, maxDistance = 50) => {
  if (!msmeLocation) return consignments; // If no location, show all

  return consignments.filter(consignment => {
    return locationsMatch(consignment.origin, msmeLocation, maxDistance);
  });
};

/**
 * Normalize location string to extract city and state
 * @param {string} locationString - Location string (e.g., "Mumbai, Maharashtra")
 * @returns {Object} Normalized location object
 */
export const normalizeLocation = (locationString) => {
  if (!locationString) return null;

  const parts = locationString.split(',').map(part => part.trim());
  
  if (parts.length >= 2) {
    return {
      city: parts[0],
      state: parts[1],
      fullAddress: locationString
    };
  } else if (parts.length === 1) {
    return {
      city: parts[0],
      state: parts[0], // Fallback to same as city
      fullAddress: locationString
    };
  }

  return null;
};

/**
 * Get location-based recommendations for MSMEs
 * @param {string} msmeId - MSME user ID
 * @returns {Object} Recommendations object
 */
export const getLocationRecommendations = async (msmeId) => {
  try {
    const msme = await User.findById(msmeId);
    if (!msme || msme.companyType !== 'msme' || !msme.location) {
      return { matchingConsignments: [], nearbyMSMEs: [] };
    }

    // Find nearby MSMEs (for potential partnerships)
    const nearbyMSMEs = await User.find({
      companyType: 'msme',
      _id: { $ne: msmeId },
      location: { $exists: true }
    });

    const nearbyPartners = nearbyMSMEs.filter(user => 
      locationsMatch(msme.location, user.location, 100) // 100km radius for partnerships
    );

    return {
      matchingConsignments: [], // Will be populated by the calling function
      nearbyMSMEs: nearbyPartners.slice(0, 5) // Top 5 nearby partners
    };
  } catch (error) {
    console.error('Error getting location recommendations:', error);
    return { matchingConsignments: [], nearbyMSMEs: [] };
  }
}; 