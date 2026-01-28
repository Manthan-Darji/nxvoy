// Comprehensive list of famous Indian cities and tourist destinations
// Sorted alphabetically for efficient binary search if needed

export const INDIAN_CITIES = [
  // Major Metro Cities
  'Mumbai, Maharashtra',
  'Delhi, NCR',
  'Bangalore, Karnataka',
  'Hyderabad, Telangana',
  'Chennai, Tamil Nadu',
  'Kolkata, West Bengal',
  'Pune, Maharashtra',
  'Ahmedabad, Gujarat',
  
  // Popular Tourist Destinations
  'Agra, Uttar Pradesh',
  'Jaipur, Rajasthan',
  'Goa',
  'Udaipur, Rajasthan',
  'Varanasi, Uttar Pradesh',
  'Kerala - Munnar',
  'Kerala - Alleppey',
  'Kerala - Kochi',
  'Kerala - Trivandrum',
  'Manali, Himachal Pradesh',
  'Shimla, Himachal Pradesh',
  'Rishikesh, Uttarakhand',
  'Haridwar, Uttarakhand',
  'Leh Ladakh',
  'Srinagar, Kashmir',
  'Gulmarg, Kashmir',
  'Darjeeling, West Bengal',
  'Gangtok, Sikkim',
  'Andaman & Nicobar Islands',
  'Ooty, Tamil Nadu',
  'Kodaikanal, Tamil Nadu',
  'Coorg, Karnataka',
  'Hampi, Karnataka',
  'Mysore, Karnataka',
  'Jodhpur, Rajasthan',
  'Jaisalmer, Rajasthan',
  'Pushkar, Rajasthan',
  'Amritsar, Punjab',
  'Khajuraho, Madhya Pradesh',
  'Ajanta Ellora, Maharashtra',
  'Shirdi, Maharashtra',
  
  // State Capitals & Major Cities
  'Lucknow, Uttar Pradesh',
  'Kanpur, Uttar Pradesh',
  'Prayagraj, Uttar Pradesh',
  'Noida, Uttar Pradesh',
  'Ghaziabad, Uttar Pradesh',
  'Meerut, Uttar Pradesh',
  'Bhopal, Madhya Pradesh',
  'Indore, Madhya Pradesh',
  'Jabalpur, Madhya Pradesh',
  'Gwalior, Madhya Pradesh',
  'Ujjain, Madhya Pradesh',
  'Chandigarh',
  'Ludhiana, Punjab',
  'Jalandhar, Punjab',
  'Patiala, Punjab',
  'Jamshedpur, Jharkhand',
  'Ranchi, Jharkhand',
  'Dhanbad, Jharkhand',
  'Patna, Bihar',
  'Gaya, Bihar',
  'Bodh Gaya, Bihar',
  'Bhubaneswar, Odisha',
  'Puri, Odisha',
  'Konark, Odisha',
  'Cuttack, Odisha',
  'Guwahati, Assam',
  'Shillong, Meghalaya',
  'Cherrapunji, Meghalaya',
  'Imphal, Manipur',
  'Aizawl, Mizoram',
  'Kohima, Nagaland',
  'Itanagar, Arunachal Pradesh',
  'Agartala, Tripura',
  'Raipur, Chhattisgarh',
  'Dehradun, Uttarakhand',
  'Nainital, Uttarakhand',
  'Mussoorie, Uttarakhand',
  'Jim Corbett, Uttarakhand',
  'Panaji, Goa',
  'Margao, Goa',
  'Vasco da Gama, Goa',
  'Thiruvananthapuram, Kerala',
  'Kozhikode, Kerala',
  'Thrissur, Kerala',
  'Wayanad, Kerala',
  'Thekkady, Kerala',
  'Kumarakom, Kerala',
  'Madurai, Tamil Nadu',
  'Coimbatore, Tamil Nadu',
  'Tiruchirappalli, Tamil Nadu',
  'Pondicherry',
  'Mahabalipuram, Tamil Nadu',
  'Kanyakumari, Tamil Nadu',
  'Rameswaram, Tamil Nadu',
  'Tirupati, Andhra Pradesh',
  'Visakhapatnam, Andhra Pradesh',
  'Vijayawada, Andhra Pradesh',
  'Amaravati, Andhra Pradesh',
  'Nagpur, Maharashtra',
  'Nashik, Maharashtra',
  'Aurangabad, Maharashtra',
  'Kolhapur, Maharashtra',
  'Mahabaleshwar, Maharashtra',
  'Lonavala, Maharashtra',
  'Alibaug, Maharashtra',
  'Surat, Gujarat',
  'Vadodara, Gujarat',
  'Rajkot, Gujarat',
  'Dwarka, Gujarat',
  'Somnath, Gujarat',
  'Kutch, Gujarat',
  'Statue of Unity, Gujarat',
  'Ahmedabad, Gujarat',
  
  // Hill Stations
  'Dalhousie, Himachal Pradesh',
  'Dharamshala, Himachal Pradesh',
  'McLeod Ganj, Himachal Pradesh',
  'Kasol, Himachal Pradesh',
  'Kullu, Himachal Pradesh',
  'Spiti Valley, Himachal Pradesh',
  'Lachung, Sikkim',
  'Pelling, Sikkim',
  'Auli, Uttarakhand',
  'Lansdowne, Uttarakhand',
  'Almora, Uttarakhand',
  'Ranikhet, Uttarakhand',
  'Mount Abu, Rajasthan',
  'Pachmarhi, Madhya Pradesh',
  'Munnar, Kerala',
  'Coonoor, Tamil Nadu',
  'Yercaud, Tamil Nadu',
  'Chikmagalur, Karnataka',
  'Sakleshpur, Karnataka',
  'Matheran, Maharashtra',
  'Panchgani, Maharashtra',
  'Lavasa, Maharashtra',
  
  // Beaches & Coastal
  'North Goa Beaches',
  'South Goa Beaches',
  'Kovalam Beach, Kerala',
  'Varkala Beach, Kerala',
  'Marina Beach, Chennai',
  'Puri Beach, Odisha',
  'Gopalpur Beach, Odisha',
  'Digha Beach, West Bengal',
  'Mandarmani Beach, West Bengal',
  'Diu Beach, Gujarat',
  'Daman Beach',
  'Tarkarli Beach, Maharashtra',
  'Havelock Island, Andaman',
  'Neil Island, Andaman',
  'Radhanagar Beach, Andaman',
  'Lakshadweep Islands',
  
  // Religious & Pilgrimage
  'Vaishno Devi, Jammu',
  'Tirupati Balaji, Andhra Pradesh',
  'Shirdi Sai Baba, Maharashtra',
  'Golden Temple, Amritsar',
  'Kedarnath, Uttarakhand',
  'Badrinath, Uttarakhand',
  'Gangotri, Uttarakhand',
  'Yamunotri, Uttarakhand',
  'Mathura, Uttar Pradesh',
  'Vrindavan, Uttar Pradesh',
  'Dwarka, Gujarat',
  'Somnath, Gujarat',
  'Rameshwaram, Tamil Nadu',
  'Madurai Meenakshi Temple',
  'Puri Jagannath, Odisha',
  'Konark Sun Temple, Odisha',
  'Ajmer Sharif, Rajasthan',
  'Bodh Gaya, Bihar',
  'Sarnath, Uttar Pradesh',
  'Hemkund Sahib, Uttarakhand',
  'Palitana, Gujarat',
  'Shravanabelagola, Karnataka',
  
  // Wildlife & Nature
  'Jim Corbett National Park',
  'Ranthambore National Park, Rajasthan',
  'Kaziranga National Park, Assam',
  'Sundarbans, West Bengal',
  'Gir National Park, Gujarat',
  'Kanha National Park, Madhya Pradesh',
  'Bandhavgarh National Park, Madhya Pradesh',
  'Periyar Wildlife Sanctuary, Kerala',
  'Nagarhole National Park, Karnataka',
  'Bandipur National Park, Karnataka',
  'Tadoba National Park, Maharashtra',
  'Valley of Flowers, Uttarakhand',
  
  // Heritage Cities
  'Jaipur Pink City, Rajasthan',
  'Jodhpur Blue City, Rajasthan',
  'Udaipur City of Lakes, Rajasthan',
  'Bikaner, Rajasthan',
  'Bundi, Rajasthan',
  'Chittorgarh, Rajasthan',
  'Kumbhalgarh, Rajasthan',
  'Orchha, Madhya Pradesh',
  'Mandu, Madhya Pradesh',
  'Chanderi, Madhya Pradesh',
  'Thanjavur, Tamil Nadu',
  'Chettinad, Tamil Nadu',
  'Bishnupur, West Bengal',
  'Murshidabad, West Bengal',
  'Lucknow Nawabi City',
  'Old Delhi',
  'Fatehpur Sikri, Uttar Pradesh',
].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

// Search function with smart matching - prioritizes prefix matches
export function searchIndianCities(query: string, maxResults = 8): string[] {
  if (!query || query.length === 0) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Split into words for multi-word matching
  const queryWords = normalizedQuery.split(/\s+/);
  
  const scored: { city: string; score: number }[] = [];
  
  for (const city of INDIAN_CITIES) {
    const normalizedCity = city.toLowerCase();
    const cityWords = normalizedCity.split(/[\s,]+/);
    
    let score = 0;
    
    // Exact match gets highest score
    if (normalizedCity === normalizedQuery) {
      score = 1000;
    }
    // Starts with query (prefix match) - high priority
    else if (normalizedCity.startsWith(normalizedQuery)) {
      score = 500 + (100 - city.length); // Shorter matches rank higher
    }
    // First word starts with query
    else if (cityWords[0].startsWith(normalizedQuery)) {
      score = 400 + (100 - city.length);
    }
    // Any word starts with query
    else if (cityWords.some(word => word.startsWith(normalizedQuery))) {
      score = 300 + (100 - city.length);
    }
    // All query words match somewhere
    else if (queryWords.every(qw => normalizedCity.includes(qw))) {
      score = 200 + (100 - city.length);
    }
    // Contains query
    else if (normalizedCity.includes(normalizedQuery)) {
      score = 100 + (100 - city.length);
    }
    
    if (score > 0) {
      scored.push({ city, score });
    }
  }
  
  // Sort by score descending, then alphabetically
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.city.localeCompare(b.city);
  });
  
  return scored.slice(0, maxResults).map(s => s.city);
}
