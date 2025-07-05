# Location-Based Matching System

## Overview

The LogiLedger AI platform now includes an intelligent location-based matching system that ensures small companies (MSMEs) only see consignments that match their geographical location. This system improves efficiency by connecting companies with transport partners in the same area.

## How It Works

### 1. Location Data Structure

#### User Location (MSMEs and Companies)
```javascript
location: {
  city: "Mumbai",
  state: "Maharashtra", 
  pincode: "400001",
  coordinates: {
    latitude: 19.0760,
    longitude: 72.8777
  }
}
```

#### Consignment Location
```javascript
origin: {
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400002",
  fullAddress: "Mumbai, Maharashtra",
  coordinates: {
    latitude: 19.0760,
    longitude: 72.8777
  }
}
```

### 2. Matching Logic

The system uses a multi-tiered approach to match locations:

#### Tier 1: Exact Match
- Same city AND same state
- Highest priority match

#### Tier 2: Coordinate-Based Match
- Uses Haversine formula to calculate distance
- Default radius: 50km
- Falls back to this if coordinates are available

#### Tier 3: State-Level Match
- Same state but different cities
- Useful for regional transport

### 3. Matching Algorithm

```javascript
function locationsMatch(location1, location2, maxDistance = 50) {
  // Exact city and state match
  if (location1.city?.toLowerCase() === location2.city?.toLowerCase() &&
      location1.state?.toLowerCase() === location2.state?.toLowerCase()) {
    return true;
  }

  // Distance-based matching if coordinates available
  if (location1.coordinates && location2.coordinates) {
    const distance = calculateDistance(
      location1.coordinates.latitude,
      location1.coordinates.longitude,
      location2.coordinates.latitude,
      location2.coordinates.longitude
    );
    return distance <= maxDistance;
  }

  // Same state fallback
  if (location1.state?.toLowerCase() === location2.state?.toLowerCase()) {
    return true;
  }

  return false;
}
```

## API Endpoints

### 1. Create Consignment (Enhanced)
**POST** `/api/consignments/create`

When a company creates a consignment, the system:
- Normalizes location data
- Finds matching MSMEs automatically
- Returns count of matching MSMEs

**Request Body:**
```json
{
  "title": "Electronics Delivery",
  "origin": "Mumbai, Maharashtra",
  "destination": "Delhi, Delhi", 
  "goodsType": "electronics",
  "weight": 500,
  "budget": 25000,
  "deadline": "2024-12-15",
  "description": "Urgent delivery"
}
```

**Response:**
```json
{
  "success": true,
  "consignment": { /* consignment data */ },
  "matchingMSMEs": 5,
  "message": "Consignment created successfully"
}
```

### 2. Get Available Consignments (Location-Filtered)
**GET** `/api/consignments/available`

For MSME users, this endpoint now:
- Filters consignments based on user's location
- Adds location match information
- Provides statistics

**Response:**
```json
{
  "success": true,
  "consignments": [
    {
      "id": "...",
      "title": "Electronics Delivery",
      "origin": {
        "city": "Mumbai",
        "state": "Maharashtra",
        "fullAddress": "Mumbai, Maharashtra"
      },
      "locationMatch": {
        "isMatch": true,
        "isExactMatch": true,
        "userLocation": { /* user location */ },
        "consignmentOrigin": { /* consignment origin */ }
      }
    }
  ],
  "totalAvailable": 25,
  "matchingCount": 8,
  "userLocation": { /* user location */ }
}
```

### 3. Location Recommendations
**GET** `/api/consignments/location-recommendations`

Provides comprehensive location-based insights for MSMEs:

**Response:**
```json
{
  "success": true,
  "recommendations": {
    "matchingConsignments": [ /* top 10 matching consignments */ ],
    "nearbyPartners": [ /* nearby MSMEs for partnerships */ ],
    "locationStats": {
      "totalConsignments": 25,
      "matchingConsignments": 8,
      "nearbyPartners": 3,
      "userLocation": { /* user location */ }
    }
  }
}
```

## Database Schema Updates

### User Model
```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields
  location: {
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }
});
```

### Consignment Model
```javascript
const consignmentSchema = new mongoose.Schema({
  // ... existing fields
  origin: {
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    fullAddress: { type: String, required: true, trim: true },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  destination: {
    // Same structure as origin
  }
});
```

## Benefits

### For Companies
1. **Targeted Reach**: Consignments are shown only to relevant MSMEs
2. **Faster Matching**: Reduced response time from qualified transport partners
3. **Better Quality**: Higher chance of getting bids from local experts

### For MSMEs
1. **Relevant Opportunities**: Only see consignments in their area
2. **Reduced Competition**: Compete with local partners only
3. **Better Efficiency**: Focus on nearby opportunities
4. **Partnership Opportunities**: Discover nearby MSMEs for collaboration

### For the Platform
1. **Improved User Experience**: More relevant content
2. **Higher Success Rate**: Better matching leads to more completed jobs
3. **Reduced Noise**: Users see only relevant information

## Configuration

### Distance Settings
- **Default Matching Radius**: 50km
- **Partnership Radius**: 100km (for finding nearby MSMEs)
- **State-Level Matching**: Enabled for broader regional coverage

### Location Format
- **Input Format**: "City, State" (e.g., "Mumbai, Maharashtra")
- **Auto-Normalization**: System automatically parses and validates locations
- **Coordinate Support**: Optional GPS coordinates for precise matching

## Future Enhancements

1. **Geocoding Integration**: Automatic coordinate lookup from addresses
2. **Route Optimization**: Consider destination locations for return trips
3. **Dynamic Radius**: Adjust matching radius based on transport type
4. **Historical Analysis**: Learn from successful matches to improve algorithm
5. **Real-time Updates**: Notify MSMEs of new consignments in their area

## Testing

### Sample Data
The system includes sample users with different locations:
- **Mumbai MSMEs**: sarah@transport.com, chennai@logistics.com
- **Delhi MSME**: delhi@transport.com  
- **Chennai MSME**: chennai@logistics.com

### Test Scenarios
1. Create consignment in Mumbai → Only Mumbai MSMEs see it
2. Create consignment in Delhi → Only Delhi MSME sees it
3. MSME in Mumbai → Sees only Mumbai consignments
4. Cross-state consignments → Visible to origin state MSMEs

## Implementation Notes

- **Backward Compatibility**: Existing consignments without location data are shown to all MSMEs
- **Performance**: Location matching uses database indexes for efficiency
- **Scalability**: Algorithm designed to handle large numbers of users and consignments
- **Privacy**: Location data is stored securely and used only for matching purposes 