import axios from 'axios';

const API_KEY = 'ae009027c35bcddf18936cb4';
const BASE_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/EUR`;

export const commonCurrencies = [
  "AED", "ARS", "AUD", "BGN", "BHD", "BRL", "CAD", "CHF", "CLP", "CNY",
  "COP", "CZK", "DKK", "EGP", "EUR", "GBP", "HKD", "HRK", "HUF", "IDR",
  "ILS", "INR", "ISK", "JOD", "JPY", "KES", "KRW", "KWD", "LBP", "MXN",
  "MYR", "NOK", "NZD", "OMR", "PHP", "PKR", "PLN", "QAR", "RON", "RUB",
  "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "UAH", "USD", "VND", "ZAR"
];

export const getExchangeRates = async () => {
  console.log('Début de la récupération des taux de change');
  
  try {
    const cachedRates = localStorage.getItem('exchangeRates');
    const cachedTimestamp = localStorage.getItem('exchangeRatesTimestamp');
    
    if (cachedRates && cachedTimestamp) {
      const now = new Date().getTime();
      const cacheAge = now - parseInt(cachedTimestamp);
      
      // Utilisez le cache si les taux ont moins de 24 heures
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log('Utilisation des taux de change en cache');
        return JSON.parse(cachedRates);
      }
    }

    const response = await axios.get(BASE_URL, { timeout: 10000 }); // 10 secondes de timeout
    console.log('API Response:', response.data);

    if (response.data.result === "success") {
      const rates = response.data.conversion_rates;
      
      const allRates = commonCurrencies.reduce((acc, currency) => {
        if (rates[currency] !== undefined) {
          acc[currency] = rates[currency];
        } else {
          console.warn(`Taux de change non disponible pour ${currency}`);
        }
        return acc;
      }, {});

      if (Object.keys(allRates).length === 0) {
        throw new Error('Aucun taux de change n\'a pu être récupéré');
      }

      localStorage.setItem('exchangeRates', JSON.stringify(allRates));
      localStorage.setItem('exchangeRatesTimestamp', new Date().getTime().toString());

      console.log('Taux de change récupérés avec succès');
      return allRates;
    } else {
      throw new Error(response.data['error-type'] || 'Erreur inconnue');
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des taux de change:', error.message);
    console.error('Erreur complète:', error);
    
    // Tenter d'utiliser les taux en cache même s'ils sont périmés en cas d'erreur
    const cachedRates = localStorage.getItem('exchangeRates');
    if (cachedRates) {
      console.log('Utilisation des taux de change en cache périmés suite à une erreur');
      return JSON.parse(cachedRates);
    }
    
    return null;
  }
};

export const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
  if (!rates || !rates[fromCurrency] || !rates[toCurrency]) {
    console.error('Taux de change non disponibles pour', fromCurrency, 'ou', toCurrency);
    return amount;
  }
  if (fromCurrency === toCurrency) return amount;
  const eurAmount = amount / rates[fromCurrency];
  return eurAmount * rates[toCurrency];
};