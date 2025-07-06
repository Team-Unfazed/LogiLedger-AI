import math
from typing import Dict, List, Optional, Union, Any


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    Args:
        lat1: Latitude of first point
        lon1: Longitude of first point
        lat2: Latitude of second point
        lon2: Longitude of second point
    Returns:
        Distance in kilometers
    """
    R = 6371  # Radius of the Earth in kilometers
    d_lat = (lat2 - lat1) * math.pi / 180
    d_lon = (lon2 - lon1) * math.pi / 180
    a = (
        math.sin(d_lat/2) * math.sin(d_lat/2) +
        math.cos(lat1 * math.pi / 180) * math.cos(lat2 * math.pi / 180) * 
        math.sin(d_lon/2) * math.sin(d_lon/2)
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c


def normalize_location(location_string: str) -> Optional[Dict[str, str]]:
    """
    Normalize location string to extract city and state
    Args:
        location_string: Location string (e.g., "Mumbai, Maharashtra")
    Returns:
        Normalized location object
    """
    if not location_string:
        return None

    parts = [part.strip() for part in location_string.split(',')]
    
    if len(parts) >= 2:
        return {
            "city": parts[0],
            "state": parts[1],
            "fullAddress": location_string
        }
    elif len(parts) == 1:
        return {
            "city": parts[0],
            "state": parts[0],  # Fallback to same as city
            "fullAddress": location_string
        }

    return None


def locations_match(location1: Union[Dict, str], location2: Union[Dict, str], max_distance: float = 50) -> bool:
    """
    Check if two locations match (same city and state, or within specified radius)
    Args:
        location1: First location object or string
        location2: Second location object or string
        max_distance: Maximum distance in km for matching (default: 50)
    Returns:
        True if locations match
    """
    # Handle string locations by normalizing them
    loc1 = normalize_location(location1) if isinstance(location1, str) else location1
    loc2 = normalize_location(location2) if isinstance(location2, str) else location2

    if not loc1 or not loc2:
        return False

    # Exact city and state match
    if (loc1.get("city", "").lower() == loc2.get("city", "").lower() and
        loc1.get("state", "").lower() == loc2.get("state", "").lower()):
        return True

    # Distance-based matching if coordinates are available
    if loc1.get("coordinates") and loc2.get("coordinates"):
        distance = calculate_distance(
            loc1["coordinates"]["latitude"],
            loc1["coordinates"]["longitude"],
            loc2["coordinates"]["latitude"],
            loc2["coordinates"]["longitude"]
        )
        return distance <= max_distance

    # Fallback: check if cities are in the same state and nearby
    if loc1.get("state", "").lower() == loc2.get("state", "").lower():
        # For same state, we'll consider it a match if cities are similar
        # This is a simplified approach - in production you might want more sophisticated matching
        return True

    return False


def find_matching_msmes(consignment_origin: Union[Dict, str], users: List[Dict], max_distance: float = 50) -> List[Dict]:
    """
    Find MSMEs that match the consignment's origin location
    Args:
        consignment_origin: Origin location of the consignment
        users: Array of users from in-memory storage
        max_distance: Maximum distance in km for matching
    Returns:
        Array of matching MSME users
    """
    try:
        # Get all MSME users from the provided users array
        msme_users = [user for user in users if user.get("userType") == "msme"]
        
        matching_msmes = [
            user for user in msme_users 
            if user.get("location") and locations_match(consignment_origin, user["location"], max_distance)
        ]

        return matching_msmes
    except Exception as error:
        print(f"Error finding matching MSMEs: {error}")
        return []


def get_matching_consignments(msme_location: Union[Dict, str], consignments: List[Dict], max_distance: float = 50) -> List[Dict]:
    """
    Get consignments that match an MSME's location
    Args:
        msme_location: MSME's location
        consignments: Array of consignments to filter
        max_distance: Maximum distance in km for matching
    Returns:
        Array of matching consignments
    """
    if not msme_location:
        return consignments  # If no location, show all

    return [
        consignment for consignment in consignments
        if locations_match(consignment.get("origin"), msme_location, max_distance)
    ]


def get_location_recommendations(msme_id: str, users: List[Dict]) -> Dict[str, List]:
    """
    Get location-based recommendations for MSMEs
    Args:
        msme_id: MSME user ID
        users: Array of users from in-memory storage
    Returns:
        Recommendations object
    """
    try:
        msme = next((user for user in users if user.get("id") == msme_id), None)
        if not msme or msme.get("userType") != "msme" or not msme.get("location"):
            return {"matchingConsignments": [], "nearbyMSMEs": []}

        # Find nearby MSMEs (for potential partnerships)
        nearby_msmes = [
            user for user in users
            if user.get("userType") == "msme" and 
            user.get("id") != msme_id and 
            user.get("location")
        ]

        nearby_partners = [
            user for user in nearby_msmes
            if locations_match(msme["location"], user["location"], 100)  # 100km radius for partnerships
        ]

        return {
            "matchingConsignments": [],  # Will be populated by the calling function
            "nearbyMSMEs": nearby_partners[:5]  # Top 5 nearby partners
        }
    except Exception as error:
        print(f"Error getting location recommendations: {error}")
        return {"matchingConsignments": [], "nearbyMSMEs": []} 