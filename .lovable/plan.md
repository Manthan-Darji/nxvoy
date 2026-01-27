
# Plan: Fix Itinerary Generation Failures

## Overview
The itinerary generation is failing due to a database constraint mismatch between the AI-generated categories and the allowed values in the `itineraries` table. This plan will expand the allowed categories, add coordinate storage, and implement robust retry logic with cleanup.

---

## Problem Summary

| Issue | Cause |
|-------|-------|
| `violates check constraint "itineraries_category_check"` | AI generates categories like `culture`, `attraction`, `food` but DB only allows `activity`, `meal`, `transport`, `accommodation`, `other` |
| Map markers don't show | No `latitude`/`longitude` columns in `itineraries` table to store coordinates |
| Orphaned trips on failure | Trip is created before AI generation, but not deleted on failure |
| Hard to debug | Insufficient console.log statements |

---

## Implementation Steps

### 1. Database Migration
Modify the `itineraries` table schema:

**Changes:**
- Drop the existing restrictive `category` CHECK constraint
- Add new constraint allowing expanded categories: `attraction`, `food`, `culture`, `adventure`, `relaxation`, `shopping`, `nightlife`, `transport`, `accommodation`, `activity`, `meal`, `other`
- Add `latitude` DECIMAL(10,8) column (nullable)
- Add `longitude` DECIMAL(11,8) column (nullable)

```text
-- Remove old constraint
ALTER TABLE public.itineraries DROP CONSTRAINT IF EXISTS itineraries_category_check;

-- Add new expanded constraint
ALTER TABLE public.itineraries ADD CONSTRAINT itineraries_category_check 
  CHECK (category IN ('attraction', 'food', 'culture', 'adventure', 'relaxation', 
                      'shopping', 'nightlife', 'transport', 'accommodation', 
                      'activity', 'meal', 'other'));

-- Add coordinate columns
ALTER TABLE public.itineraries ADD COLUMN latitude DECIMAL(10,8);
ALTER TABLE public.itineraries ADD COLUMN longitude DECIMAL(11,8);
```

### 2. Update Edge Function (`generate-itinerary/index.ts`)
Simplify prompt and improve reliability:

**Changes:**
- Simplify prompt to request only 3-4 activities per day
- Reduce complexity by removing "tips" and "cuisine" fields
- Use explicit category list matching the new DB constraint
- Add timeout handling (60 seconds)
- Add detailed console.log statements at each step
- Improve JSON extraction and error messages

### 3. Update TripPreviewCard (`src/components/TripPreviewCard.tsx`)
Add retry logic and trip cleanup:

**Changes:**
- Track created trip ID in state
- On failure: delete the trip if one was created
- Add "Retry" button on error
- Show more informative loading/error states
- Add extensive console.log statements
- Update loading text: "Creating your itinerary... ✨ (This may take 15-20 seconds)"

### 4. Update Trip Service (`src/services/tripService.ts`)
Store coordinates in returned data:

**Changes:**
- Update `ItineraryActivity` interface to include `latitude` and `longitude`
- Parse coordinates from AI response

### 5. Update Frontend Components
Use new coordinate columns:

**Changes to `TripPreviewCard.tsx`:**
- Include `latitude` and `longitude` when inserting itinerary items
- Add console.log for successful saves

**Changes to `Itinerary.tsx`:**
- Fetch `latitude` and `longitude` from database
- Pass coordinates to timeline/map components

**Changes to `ActivityCard.tsx`:**
- Use `latitude`/`longitude` props instead of `coordinates` object
- Update interface accordingly

**Changes to `ItineraryMap.tsx`:**
- Use `latitude`/`longitude` from activity data instead of nested coordinates

---

## Technical Details

### Updated Edge Function Prompt
```text
Create a {days}-day itinerary for {destination} with budget ${budget}.

Interests: {interests}
Traveler type: {tripType}

For EACH day provide 3-4 activities with times spread throughout the day.

Return ONLY this JSON (no markdown):
{
  "days": [
    {
      "dayNumber": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "09:00",
          "endTime": "12:00",
          "name": "Place Name",
          "location": "Address",
          "lat": 15.5551,
          "lng": 73.7516,
          "duration": 180,
          "cost": 25,
          "category": "attraction",
          "description": "Brief description"
        }
      ]
    }
  ]
}

Valid categories: attraction, food, culture, adventure, relaxation, shopping, nightlife, transport
```

### Error Handling Flow
```text
User clicks "Generate Itinerary"
    |
    v
Show loading state
    |
    v
Create trip in DB
    |
    v
Call AI edge function
    |
    +---> Success: Save itinerary items, navigate to /itinerary/:id
    |
    +---> Failure: Delete trip, show error with Retry button
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/migrations/new_migration.sql` | Expand category constraint, add lat/lng columns |
| `supabase/functions/generate-itinerary/index.ts` | Simplify prompt, improve logging, add timeout |
| `src/components/TripPreviewCard.tsx` | Add retry logic, cleanup on failure, logging |
| `src/services/tripService.ts` | Update interfaces for coordinates |
| `src/pages/Itinerary.tsx` | Fetch lat/lng from DB |
| `src/components/itinerary/ActivityCard.tsx` | Update interface to use lat/lng |
| `src/components/itinerary/ItineraryMap.tsx` | Use lat/lng directly |

---

## Expected Outcome
- Itinerary generation completes successfully without category constraint violations
- Map shows markers for all activities using stored coordinates
- Failed generations automatically clean up orphaned trips
- Users can retry failed generations with a single click
- Detailed console logs help debug any remaining issues
