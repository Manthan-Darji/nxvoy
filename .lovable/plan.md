

# Fix Plan: Slow Trip Generation & Inaccurate Map Pins

## Issues Identified

### Issue 1: Slow Trip Plan Generation
After analyzing the edge function (`generate-trip-plan/index.ts`), I found several factors causing slow generation:

1. **Complex Prompt**: The system asks for 4-6 activities per day with detailed transport, cost, and timing information
2. **Large Token Budget**: `maxTokens` can go up to 9000 tokens, encouraging verbose responses
3. **Single AI Call Architecture**: Everything is generated in one large AI call rather than being broken into faster, focused requests
4. **75-second Timeout**: While this prevents infinite waits, it's still a long time for users

### Issue 2: Inaccurate Map Pins
The map component has these problems:

1. **Geocoding API Not Enabled**: The code tries to use `google.maps.Geocoder()` for the destination (line 98-107), but your Google Cloud project doesn't have the Geocoding API enabled - causing it to fail silently
2. **Fallback to Default Center**: When geocoding fails, the map stays centered on the default location (center of India) instead of the actual destination
3. **Places API Works But Inconsistently**: The Places API `findPlaceFromQuery` is used for activities, but search queries may not find exact matches for generic location names from the AI

## What Google Maps APIs You Need to Enable

In your Google Cloud Console (https://console.cloud.google.com), enable these APIs for your project:

| API Name | Purpose | Status |
|----------|---------|--------|
| **Maps JavaScript API** | Display the map | Already enabled |
| **Places API** | Find activity locations | Already enabled |
| **Geocoding API** | Convert destination name to coordinates | **NEED TO ENABLE** |

**Steps to enable Geocoding API:**
1. Go to Google Cloud Console → APIs & Services → Library
2. Search for "Geocoding API"
3. Click on it and press "Enable"
4. Make sure your API key has permission to use it (check API key restrictions)

---

## Technical Implementation Plan

### Part 1: Speed Up Trip Generation

**File: `supabase/functions/generate-trip-plan/index.ts`**

Changes:
1. **Use Faster Model**: Switch to `google/gemini-3-flash-preview` which is optimized for speed while maintaining quality
2. **Reduce Token Budget**: Cap `maxTokens` at 6000 to encourage more concise responses
3. **Simplify Prompt**: 
   - Reduce activities per day to 3-4 for all trip lengths
   - Remove optional fields from the schema to reduce AI decision-making time
   - Add explicit instruction to be concise
4. **Reduce Temperature**: Lower from 0.4 to 0.3 for faster, more deterministic responses
5. **Shorter Timeout**: Reduce to 60 seconds (if it takes longer, the response is likely too complex anyway)

### Part 2: Fix Map Pin Accuracy

**File: `src/components/trip-result/TripResultMap.tsx`**

Changes:
1. **Unified Geocoding with Places API**: Replace the Geocoder usage with Places API for both destination AND activities - since Places API is already working
2. **Better Search Queries**: Append ", India" or country context to improve search accuracy
3. **Distinct Marker Styles**:
   - Main destination: Large red pin marker (not just a circle)
   - Activity locations: Smaller colored circle markers (mini pins) with numbers
4. **Add Fallback Geocoding**: If Places API fails, try a simplified search query
5. **Better Zoom/Bounds**: Auto-fit the map to show all markers, not just the center
6. **Visual Distinction**: Make the main destination marker visually different (larger, different icon) from activity markers

### Part 3: Improve AI Location Data Quality

**File: `supabase/functions/generate-trip-plan/index.ts`**

Changes:
1. **Request Specific Addresses**: Update the prompt to ask for more specific `location_address` values that geocode better
2. **Add Location Context**: Request the AI to include the city/region in location names for better geocoding accuracy

---

## Summary of Changes

| File | Changes |
|------|---------|
| `supabase/functions/generate-trip-plan/index.ts` | Faster model, reduced tokens, simpler prompt, better location instructions |
| `src/components/trip-result/TripResultMap.tsx` | Use Places API for all geocoding, distinct marker styles, better zoom handling |

## Expected Results

1. **Generation Speed**: 30-50% faster trip generation (target: under 30 seconds for most trips)
2. **Map Accuracy**: Pins will accurately show the destination and each activity location
3. **Visual Clarity**: Large pin for destination, numbered mini-pins for activities

## User Action Required

Please enable the **Geocoding API** in your Google Cloud Console for your API key. This will allow more reliable location lookups. If you'd prefer to skip this, the implementation will use Places API as a fallback (which is already working).

