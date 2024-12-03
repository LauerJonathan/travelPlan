import React, { useState, useEffect } from 'react';

const AutocompleteLocationInput = ({ id, name, value, onChange, onClick, className, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Synchroniser la valeur initiale
  useEffect(() => {
    if (value && typeof value === 'object' && value.name) {
      setInputValue(value.name);
    } else if (typeof value === 'string') {
      setInputValue(value);
    }
  }, [value]);

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
        {
          headers: {
            'Accept-Language': 'fr'
          }
        }
      );

      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Si le champ est vide, réinitialiser
    if (!newValue.trim()) {
      onChange({ name: '', lat: null, lon: null });
      setSuggestions([]);
      return;
    }

    // Mettre à jour avec la valeur temporaire
    onChange({ name: newValue, lat: null, lon: null });

    // Rechercher après un court délai
    setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion) => {
    const newLocation = {
      name: suggestion.display_name,
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon)
    };
    setInputValue(suggestion.display_name);
    onChange(newLocation);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full">
      <input
        id={id}
        name={name}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onClick={onClick}
        className={className}
        placeholder={placeholder || "Rechercher un lieu..."}
        autoComplete="off"
      />
      
      {isLoading && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border rounded shadow-lg mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              {suggestion.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteLocationInput;