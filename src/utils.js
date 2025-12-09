export function getUrlSearchParams() {
  // Get raw URL search string (e.g., "?keyword=phone&minPrice=100&maxPrice=5000&status=1")
  const searchParams = new URLSearchParams(window.location.search);
  const params = {};

  // Iterate over all params, decode and filter empty values
  for (const [key, value] of searchParams.entries()) {
    if (value.trim() !== "") {
      // Decode URL-encoded values (e.g., "iphone%2015" → "iphone 15")
      const decodedValue = decodeURIComponent(value.trim());
      
      // Auto-convert number-like values (e.g., "100" → 100, "true" → true)
      params[key] = isNaN(decodedValue) 
        ? decodedValue === "true" ? true : decodedValue === "false" ? false : decodedValue
        : Number(decodedValue);
    }
  }

  return params;
}
