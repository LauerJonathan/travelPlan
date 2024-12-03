import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  Camera, 
  Edit3, 
  Trash2,
  Hotel,
  Home,
  Tent,
  Caravan,
  Plane,
  Car,
  Bus,
  Sailboat,
  Ship,
  TramFront,
  CableCar,
  CarTaxiFront
} from 'lucide-react';
import { getExchangeRates, convertCurrency, commonCurrencies } from '../utils/currencyUtils';

const accommodationIcons = {
  hotel: Hotel,
  house: Home,
  tent: Tent,
  caravan: Caravan
};

const transportIcons = {
  plane: Plane,
  car: Car,
  bus: Bus,
  sailboat: Sailboat,
  ship: Ship,
  tram: TramFront,
  cableCar: CableCar,
  taxi: CarTaxiFront
};

const CustomSelect = ({ id, name, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        id={id}
        name={name}
        className="p-2 border rounded flex items-center justify-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {React.createElement(transportIcons[value], { className: "w-6 h-6" })}
      </button>
      {isOpen && (
        <ul className="absolute z-10 bg-white border rounded mt-1 w-full" role="listbox">
          {options.map(([type, Icon]) => (
            <li
              key={type}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center justify-center"
              onClick={() => {
                onChange(type);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={type === value}
            >
              {React.createElement(Icon, { className: "w-6 h-6" })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const DayDetail = ({ 
  selectedTrip, 
  selectedDayId, 
  updateDay, 
  deleteDay, 
  handlePageChange,
  addTransport, 
  updateTransport, 
  removeTransport, 
  addActivity, 
  updateActivity, 
  removeActivity,
  setSelectedDayId
}) => {
  const [exchangeRates, setExchangeRates] = useState(() => {
    const cachedRates = localStorage.getItem('exchangeRates');
    return cachedRates ? JSON.parse(cachedRates) : {};
  });
  const [inputCurrency, setInputCurrency] = useState(() => {
    return localStorage.getItem(`inputCurrency_${selectedTrip.id}`) || 'EUR';
  });
  const [displayCurrency, setDisplayCurrency] = useState(() => {
    return localStorage.getItem(`displayCurrency_${selectedTrip.id}`) || 'EUR';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const exchangeRatesRef = useRef(exchangeRates);
 // const [selectedExpenseDayId, setSelectedExpenseDayId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchRates = async () => {
      if (Object.keys(exchangeRatesRef.current).length === 0) {
        setIsLoading(true);
        try {
          const rates = await getExchangeRates();
          if (isMounted && rates && Object.keys(rates).length > 0) {
            setExchangeRates(rates);
            exchangeRatesRef.current = rates;
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des taux de change:", error);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
  
    fetchRates();
  
    return () => {
      isMounted = false;
    };
  }, []); 

  const day = selectedTrip.days.find(d => d.id === selectedDayId);
  if (!day) return <div>Journée non trouvée</div>;

  const iconKeys = Object.keys(accommodationIcons);

  const convertAndFormat = (amount, from, to) => {
    if (!exchangeRates[from] || !exchangeRates[to]) {
      return `${Math.round(amount)} ${from}`;
    }
    const converted = convertCurrency(amount, from, to, exchangeRates);
    return `${Math.round(amount)} ${from} (${Math.round(converted)} ${to})`;
  };

  const totalTransport = (day.transports || []).reduce((total, transport) => 
    total + convertCurrency(Number(transport.price) || 0, inputCurrency, displayCurrency, exchangeRates), 0
  );

  const totalActivities = (day.activities || []).reduce((total, activity) => 
    total + convertCurrency(Number(activity.price) || 0, inputCurrency, displayCurrency, exchangeRates), 0
  );

  const totalFood = ['petitDejeuner', 'dejeuner', 'diner'].reduce(
    (total, meal) => total + (Number(day.food?.[meal]?.count || 1) * (Number(day.food?.[meal]?.price) || 0)),
    0
  );
  
  const totalDay = 
    (Number(day.accommodation?.price) || 0) + 
    totalFood +
    totalTransport +
    totalActivities;
  
    const handleNumberInput = (e) => {
      e.target.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
      e.target.addEventListener('keydown', (e) => {
        if (e.which === 38 || e.which === 40) e.preventDefault();
      });
    };

  const budgetData = [
    { name: 'Logement', value: convertCurrency(Number(day.accommodation?.price || 0), inputCurrency, displayCurrency, exchangeRates) },
    { name: 'Nourriture', value: convertCurrency(totalFood, inputCurrency, displayCurrency, exchangeRates) },
    { name: 'Transports', value: totalTransport },
    { name: 'Activités', value: totalActivities },
  ].filter(item => item.value > 0);
  
    const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];

  const handleDateChange = (direction) => {
    const currentIndex = selectedTrip.days.findIndex(d => d.id === selectedDayId);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < selectedTrip.days.length) {
      setSelectedDayId(selectedTrip.days[newIndex].id);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateDay(day.id, { image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCurrencyChange = (newCurrency, type) => {
    if (type === 'input') {
      setInputCurrency(newCurrency);
      localStorage.setItem(`inputCurrency_${selectedTrip.id}`, newCurrency);
      updateDay(day.id, { currency: newCurrency });
    } else {
      setDisplayCurrency(newCurrency);
      localStorage.setItem(`displayCurrency_${selectedTrip.id}`, newCurrency);
    }
  };

  if (isLoading) {
    return <div>Chargement des taux de change...</div>;
  }

  return (
   <div className="app flex flex-col min-h-screen">
      <div 
        className="text-xl font-bold mb-4 p-2 rounded w-full"
        style={{
          backgroundColor: selectedTrip.color,
          color: selectedTrip.textColor,
          fontFamily: selectedTrip.font
        }}
      >
        {selectedTrip.name}
      </div>
  
      <button onClick={() => handlePageChange('tripDetail')} className="bg-gray-500 text-white p-2 rounded w-full mb-4 flex items-center justify-center">
        <Home className="mr-2" />Retour
      </button>

      <div className="flex justify-center space-x-4 mb-4">
     
      <button 
  onClick={() => handlePageChange('realExpenses', { selectedDayId: day.id })}
  className="bg-blue-800 text-white p-2 rounded flex items-center"
>
  <PlusCircle className="mr-2" />Ajouter une dépense
</button>

        <button onClick={() => {
          if(window.confirm("Êtes-vous sûr de vouloir supprimer cette journée ?")) {
            deleteDay(day.id);
            handlePageChange('tripDetail');
          }
        }} className="bg-red-500 text-white p-2 rounded">
          Supprimer la journée
        </button>
      </div>
  
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => handleDateChange('prev')} className="p-2 bg-blue-500 text-white w-10 h-10 flex items-center justify-center rounded"><ChevronLeft className="w-6 h-6" /></button>
        <h3 className="text-xl font-semibold">{format(new Date(day.date), 'EEEE d MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}</h3>
        <button onClick={() => handleDateChange('next')} className="p-2 bg-blue-500 text-white w-10 h-10 flex items-center justify-center rounded"><ChevronRight className="w-6 h-6" /></button>
      </div>
  
      <div className="mb-4 flex flex-wrap items-center">
      <div className="w-full md:w-1/2 mb-2 md:mb-0">
        <label htmlFor="input-currency" className="mr-2">Devise d'entrée :</label>
        <select
          id="input-currency"
          name="input-currency"
          value={inputCurrency}
          onChange={(e) => handleCurrencyChange(e.target.value, 'input')}
          className="p-2 border rounded"
        >
          {commonCurrencies.map(currency => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
      </div>
      <div className="w-full md:w-1/2">
        <label htmlFor="display-currency" className="mr-2">Devise d'affichage :</label>
        <select
          id="display-currency"
          name="display-currency"
          value={displayCurrency}
          onChange={(e) => handleCurrencyChange(e.target.value, 'display')}
          className="p-2 border rounded"
        >
          {commonCurrencies.map(currency => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
      </div>
    </div>

{/* Infos générales */}
<div className="bg-white shadow rounded-lg p-6 mb-4">
        <h4 className="text-lg font-semibold mb-4">Jour {selectedTrip.days.indexOf(day) + 1}</h4>
        <h5 className="text-md font-medium mb-2">{day.name}</h5>
        <p className="mb-4">{day.location.name}</p>
        <div className="flex justify-center mb-4">
          <div className="relative w-64 h-64">
            {day.image ? (
              <img src={day.image} alt={day.name} className="w-full h-full object-cover rounded" />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400" />
              </div>
            )}
            <label className="absolute bottom-2 right-2 p-1 bg-white rounded-full shadow cursor-pointer">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <Edit3 className="w-4 h-4" />
            </label>
          </div>
        </div>
        <h5 className="font-semibold mt-4 mb-2">PROGRAMME :</h5>
        <label htmlFor={`day-planning-${day.id}`}>Programme de la journée :</label>
        <textarea
          id={`day-planning-${day.id}`}
          name={`day-planning-${day.id}`}
          className="w-full p-2 border rounded"
          style={{ height: '150px' }}
          placeholder="Décrivez le programme de la journée..."
          value={day.generalInfo?.planning || ''}
          onChange={(e) => updateDay(day.id, { generalInfo: { planning: e.target.value } })}
        />
      </div>

{/* Logement */}
<div className="bg-white shadow rounded-lg p-6 mb-4">
  <h4 className="text-lg font-semibold mb-4">LOGEMENT :</h4>
  <div className="flex items-center space-x-2 mb-2">
  <button 
  onClick={() => setCurrentIconIndex((prevIndex) => (prevIndex + 1) % iconKeys.length)}
  aria-label={`Changer l'icône d'hébergement (actuellement : ${iconKeys[currentIconIndex]})`}
>
  {React.createElement(accommodationIcons[iconKeys[currentIconIndex]], { className: "w-6 h-6" })}
</button>
    <input
  id={`accommodation-name-${day.id}`}
  name={`accommodation-name-${day.id}`}
  type="text"
  className="flex-grow p-2 border rounded"
  placeholder="Nom du logement"
  value={day.accommodation?.name || ''}
  onChange={(e) => updateDay(day.id, { accommodation: { ...day.accommodation, name: e.target.value, type: iconKeys[currentIconIndex] } })}
/>
  </div>
        <div className="flex items-center justify-between mb-2">
        <div>
  <span id="reservation-label" className="mr-2">Réservé :</span>
  <button
    aria-labelledby="reservation-label"
    className={`px-3 py-1 rounded ${day.accommodation?.reserved ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
    onClick={() => updateDay(day.id, { accommodation: { ...day.accommodation, reserved: true } })}
  >
    Oui
  </button>
  <button
    aria-labelledby="reservation-label"
    className={`px-3 py-1 rounded ml-2 ${!day.accommodation?.reserved ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
    onClick={() => updateDay(day.id, { accommodation: { ...day.accommodation, reserved: false } })}
  >
    Non
  </button>
</div>
<div className="flex items-center">
  <span className="mr-2">Prix :</span>
  <input
    id={`accommodation-price-${day.id}`}
    name={`accommodation-price-${day.id}`}
    type="number"
    onFocus={handleNumberInput}
    min="0"
    step="1"
    className="w-24 p-2 border rounded mr-2"
    placeholder="Prix"
    value={day.accommodation?.price || ''}
    onChange={(e) => updateDay(day.id, { accommodation: { ...day.accommodation, price: Math.max(0, Number(e.target.value)) } })}
  />
  <span>{inputCurrency}</span>
</div>
        </div>
        <label htmlFor={`accommodation-notes-${day.id}`}>Notes sur le logement :</label>
<textarea
  id={`accommodation-notes-${day.id}`}
  name={`accommodation-notes-${day.id}`}
  className="w-full p-2 border rounded mb-2"
  placeholder="Notes sur le logement"
  value={day.accommodation?.notes || ''}
  onChange={(e) => updateDay(day.id, { accommodation: { ...day.accommodation, notes: e.target.value } })}
/>
        <div className="flex items-center">
        <label htmlFor={`accommodation-url-${day.id}`}>URL du logement :</label>
<input
  id={`accommodation-url-${day.id}`}
  name={`accommodation-url-${day.id}`}
  type="url"
  className="flex-grow p-2 border rounded mr-2"
  placeholder="URL du logement"
  value={day.accommodation?.url || ''}
  onChange={(e) => updateDay(day.id, { accommodation: { ...day.accommodation, url: e.target.value } })}
/>
          <a href={day.accommodation?.url} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white p-2 rounded">
            Visiter
          </a>
        </div>
        <p className="font-semibold mt-2">
    Total : {convertAndFormat(Number(day.accommodation?.price || 0), inputCurrency, displayCurrency)}
  </p>
</div>

{/* Nourriture */}
<div className="bg-white shadow rounded-lg p-6 mb-4">
  <h4 className="text-lg font-semibold mb-4">NOURRITURE :</h4>
  <div className="grid grid-cols-5 gap-2 mb-2 font-semibold">
    <div>Repas</div>
    <div>Nombre</div>
    <div>Prix unitaire</div>
    <div>Devise</div>
    <div>Total</div>
  </div>
  {['petitDejeuner', 'dejeuner', 'diner'].map((meal) => (
    <div key={meal} className="grid grid-cols-5 gap-2 mb-2 items-center">
      <label htmlFor={`${meal}-count-${day.id}`}>
        {meal === 'petitDejeuner' ? 'Petit-déjeuner' : meal === 'dejeuner' ? 'Déjeuner' : 'Dîner'}
      </label>
      <input
        id={`${meal}-count-${day.id}`}
        name={`${meal}-count-${day.id}`}
        type="number"
        onFocus={handleNumberInput}
        min="0"
        step="1"
        className="w-full p-2 border rounded"
        placeholder="Nb"
        value={day.food?.[meal]?.count || 1}
        onChange={(e) => updateDay(day.id, { food: { ...day.food, [meal]: { ...day.food?.[meal], count: Math.max(0, Number(e.target.value)) } } })}
      />
      <div>
        <label htmlFor={`${meal}-price-${day.id}`} className="sr-only">Prix unitaire</label>
        <input
          id={`${meal}-price-${day.id}`}
          name={`${meal}-price-${day.id}`}
          type="number"
          onFocus={handleNumberInput}
          min="0"
          step="1"
          className="w-full p-2 border rounded"
          placeholder="Prix"
          value={day.food?.[meal]?.price || ''}
          onChange={(e) => updateDay(day.id, { food: { ...day.food, [meal]: { ...day.food?.[meal], price: Math.max(0, Number(e.target.value)) } } })}
        />
      </div>
      <div>{inputCurrency}</div>
      <div>
        {convertAndFormat(
          (Number(day.food?.[meal]?.count || 1) * (Number(day.food?.[meal]?.price) || 0)),
          inputCurrency,
          displayCurrency
        )}
      </div>
    </div>
  ))}
  <p className="font-semibold mt-2">
    Total : {convertAndFormat(
      ['petitDejeuner', 'dejeuner', 'diner'].reduce(
        (total, meal) => total + (Number(day.food?.[meal]?.count || 1) * (Number(day.food?.[meal]?.price) || 0)),
        0
      ),
      inputCurrency,
      displayCurrency
    )}
  </p>
</div>

{/* Transports */}
<div className="bg-white shadow rounded-lg p-6 mb-4">
  <h4 className="text-lg font-semibold mb-4">TRANSPORTS :</h4>
  <div className="grid grid-cols-12 gap-2 mb-2 font-semibold">
    <div className="col-span-1">Type</div>
    <div className="col-span-4">Description</div>
    <div className="col-span-2">Nombre</div>
    <div className="col-span-2">Prix unitaire</div>
    <div className="col-span-1">Devise</div>
    <div className="col-span-2">Total</div>
  </div>
  {(day.transports || []).map((transport, index) => (
    <div key={transport.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
      <div className="col-span-1">
        <CustomSelect
          id={`transport-type-${transport.id}`}
          name={`transport-type-${transport.id}`}
          options={Object.entries(transportIcons)}
          value={transport.type}
          onChange={(newType) => updateTransport(day.id, transport.id, { type: newType })}
        />
      </div>
      <div className="col-span-4">
        <input
          id={`transport-description-${transport.id}`}
          name={`transport-description-${transport.id}`}
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Description"
          value={transport.description}
          onChange={(e) => updateTransport(day.id, transport.id, { description: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <input
          id={`transport-count-${transport.id}`}
          name={`transport-count-${transport.id}`}
          type="number"
          onFocus={handleNumberInput}
          min="1"
          step="1"
          className="w-full p-2 border rounded"
          placeholder="Nombre"
          value={transport.count || 1}
          onChange={(e) => updateTransport(day.id, transport.id, { count: Math.max(1, parseInt(e.target.value)) })}
        />
      </div>
      <div className="col-span-2">
        <input
          id={`transport-price-${transport.id}`}
          name={`transport-price-${transport.id}`}
          type="number"
          onFocus={handleNumberInput}
          min="0"
          step="0.01"
          className="w-full p-2 border rounded"
          placeholder="Prix unitaire"
          value={transport.price === null || transport.price === '' ? '' : transport.price}
          onChange={(e) => {
            const value = e.target.value;
            updateTransport(day.id, transport.id, { price: value === '' ? null : value });
          }}
        />
      </div>
      <div className="col-span-1">{inputCurrency}</div>
      <div className="col-span-1">
        {transport.price !== null && transport.price !== '' 
          ? convertAndFormat((transport.count || 1) * Number(transport.price), inputCurrency, displayCurrency)
          : '-'}
      </div>
      <div className="col-span-1">
        <button 
          onClick={() => removeTransport(day.id, transport.id)} 
          className="text-red-500"
          aria-label={`Supprimer le transport ${transport.description || ''}`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  ))}
  <button 
    onClick={() => addTransport(day.id)} 
    className="mt-2 bg-blue-500 text-white p-2 rounded"
    aria-label="Ajouter un nouveau moyen de transport"
  >
    Ajouter un transport
  </button>
  <p className="font-semibold mt-2">
    Total : {convertAndFormat(
      (day.transports || []).reduce((total, transport) => {
        const price = transport.price !== null && transport.price !== '' ? Number(transport.price) : 0;
        return total + (transport.count || 1) * price;
      }, 0),
      inputCurrency,
      displayCurrency
    )}
  </p>
</div>

   
   {/* Activités / Extras */}
<div className="bg-white shadow rounded-lg p-6 mb-4">
  <h4 className="text-lg font-semibold mb-4">ACTIVITES/EXTRAS :</h4>
  <div className="grid grid-cols-12 gap-2 mb-2 font-semibold">
    <div className="col-span-4">Description</div>
    <div className="col-span-2">Nombre</div>
    <div className="col-span-2">Prix unitaire</div>
    <div className="col-span-1">Devise</div>
    <div className="col-span-2">Total</div>
    <div className="col-span-1"></div>
  </div>
  {(day.activities || []).map((activity) => (
    <div key={activity.id} className="grid grid-cols-12 gap-2 mb-2 items-center">
      <div className="col-span-4">
        <input
          id={`activity-description-${activity.id}`}
          name={`activity-description-${activity.id}`}
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Description"
          value={activity.description}
          onChange={(e) => updateActivity(day.id, activity.id, { description: e.target.value })}
        />
      </div>
      <div className="col-span-2">
        <input
          id={`activity-count-${activity.id}`}
          name={`activity-count-${activity.id}`}
          type="number"
          onFocus={handleNumberInput}
          step="1"
          min="1"
          className="w-full p-2 border rounded"
          placeholder="Nombre"
          value={activity.count || 1}
          onChange={(e) => updateActivity(day.id, activity.id, { count: Math.max(1, parseInt(e.target.value)) })}
        />
      </div>
      <div className="col-span-2">
        <input
          id={`activity-price-${activity.id}`}
          name={`activity-price-${activity.id}`}
          type="number"
          onFocus={handleNumberInput}
          min="0"
          step="0.01"
          className="w-full p-2 border rounded"
          placeholder="Prix unitaire"
          value={activity.price === null || activity.price === '' ? '' : activity.price}
          onChange={(e) => {
            const value = e.target.value;
            updateActivity(day.id, activity.id, { price: value === '' ? null : value });
          }}
        />
      </div>
      <div className="col-span-1">{inputCurrency}</div>
      <div className="col-span-2">
        {activity.price !== null && activity.price !== '' 
          ? convertAndFormat((activity.count || 1) * Number(activity.price), inputCurrency, displayCurrency)
          : '-'}
      </div>
      <div className="col-span-1">
        <button 
          onClick={() => removeActivity(day.id, activity.id)} 
          className="text-red-500"
          aria-label={`Supprimer l'activité ${activity.description || ''}`}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  ))}
  <button 
    onClick={() => addActivity(day.id)} 
    className="mt-2 bg-blue-500 text-white p-2 rounded"
    aria-label="Ajouter une nouvelle activité"
  >
    Ajouter une activité
  </button>
  <p className="font-semibold mt-2">
    Total : {convertAndFormat(
      (day.activities || []).reduce((total, activity) => {
        const price = activity.price !== null && activity.price !== '' ? Number(activity.price) : 0;
        return total + (activity.count || 1) * price;
      }, 0),
      inputCurrency,
      displayCurrency
    )}
  </p>
</div>

   {/* Budget prévisionnel */}
   <div className="bg-white shadow rounded-lg p-6 mb-4">
        <h4 className="text-lg font-semibold mb-4">BUDGET PREVISIONNEL :</h4>
        <div className="flex justify-between items-center mb-4">
          <p className="font-semibold">
            Total de la journée : {convertAndFormat(totalDay, inputCurrency, displayCurrency)}
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-full">
          <ResponsiveContainer width="100%" height={400}>
  <PieChart>
    <Pie
      data={budgetData}
      cx="50%"
      cy="50%"
      labelLine={true}
      outerRadius={150}
      fill="#8884d8"
      dataKey="value"
      label={({ percent, value }) => 
        `${(percent * 100).toFixed(0)}% (${Math.round(value)} ${inputCurrency}, ${Math.round(convertCurrency(value, inputCurrency, displayCurrency, exchangeRates))} ${displayCurrency})`
      }
    >
      {budgetData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
      ))}
    </Pie>
    <Legend />
  </PieChart>
</ResponsiveContainer>
          </div>
        </div>
      </div>

      <button onClick={() => handlePageChange('tripDetail')} className="bg-gray-500 text-white p-2 rounded w-full mb-4 flex items-center justify-center">
        <Home className="mr-2" />Retour
      </button>
    </div>

  );
};

export default DayDetail;