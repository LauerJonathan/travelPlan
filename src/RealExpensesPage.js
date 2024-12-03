import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, ArrowRight, Plus, Trash2, Home } from 'lucide-react';
import { convertCurrency, getExchangeRates } from './utils/currencyUtils';

// Styles pour les inputs numériques
const styles = `
  .no-spinner::-webkit-inner-spin-button,
  .no-spinner::-webkit-outer-spin-button {
    -webkit-appearance: none;
    appearance: none;
    margin: 0;
  }

  .no-spinner {
    -moz-appearance: textfield;
    appearance: textfield;
  }
`;

const RealExpensesPage = ({ selectedTrip, handlePageChange, expenses, setExpenses, selectedDayId }) => {
  const [currentDayIndex, setCurrentDayIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [inputCurrency, setInputCurrency] = useState('EUR');
  const [exchangeRates, setExchangeRates] = useState({});

  const getCurrentDay = useCallback(() => {
    if (!selectedTrip?.days || selectedTrip.days.length === 0) return -1;
    const today = new Date().toISOString().split('T')[0];
    const tripDayIndex = selectedTrip.days.findIndex(day => day.date === today);
    return tripDayIndex !== -1 ? tripDayIndex : 0;
  }, [selectedTrip]);

  useEffect(() => {

    const fetchExchangeRates = async () => {
      try {
        const rates = await getExchangeRates();
        setExchangeRates(rates);
      } catch (error) {
        console.error("Erreur lors de la récupération des taux de change:", error);
      }
    };

    fetchExchangeRates();

    const initializeComponent = async () => {
      setIsLoading(true);
      if (selectedTrip?.days?.length > 0) {
        let index;
        if (selectedDayId) {
          index = selectedTrip.days.findIndex(day => day.id === selectedDayId);
          index = index !== -1 ? index : 0;
        } else {
          index = getCurrentDay();
        }
        setCurrentDayIndex(index);
        // Utilisez la devise de la journée si elle existe, sinon utilisez EUR par défaut
        const dayCurrency = selectedTrip.days[index].currency || 'EUR';
        setInputCurrency(dayCurrency);
      }
      setIsLoading(false);
    };

    initializeComponent();
  }, [selectedTrip, selectedDayId, getCurrentDay]);

  const navigateDay = (direction) => {
    setCurrentDayIndex(prevIndex => {
      const newIndex = Math.max(0, Math.min(prevIndex + direction, selectedTrip.days.length - 1));
      // Mettez à jour la devise lorsque vous changez de jour
      const newDayCurrency = selectedTrip.days[newIndex].currency || 'EUR';
      setInputCurrency(newDayCurrency);
      return newIndex;
    });
  };

  const addExpense = (category) => {
    setExpenses(prevExpenses => {
      const currentDayExpenses = prevExpenses[selectedTrip.id]?.[currentDayIndex] || {};
      const categoryExpenses = currentDayExpenses[category] || [];
      return {
        ...prevExpenses,
        [selectedTrip.id]: {
          ...prevExpenses[selectedTrip.id],
          [currentDayIndex]: {
            ...currentDayExpenses,
            [category]: [...categoryExpenses, { description: '', price: '' }]
          }
        }
      };
    });
  };

  const updateExpense = (category, index, field, value) => {
    if (field === 'price') {
      value = value === '' ? null : Math.max(0, Number(value));
    }
    setExpenses(prevExpenses => ({
      ...prevExpenses,
      [selectedTrip.id]: {
        ...prevExpenses[selectedTrip.id],
        [currentDayIndex]: {
          ...prevExpenses[selectedTrip.id]?.[currentDayIndex],
          [category]: (prevExpenses[selectedTrip.id]?.[currentDayIndex]?.[category] || []).map((expense, i) => 
            i === index ? { ...expense, [field]: value } : expense
          )
        }
      }
    }));
  };

  const removeExpense = (category, index) => {
    setExpenses(prevExpenses => ({
      ...prevExpenses,
      [selectedTrip.id]: {
        ...prevExpenses[selectedTrip.id],
        [currentDayIndex]: {
          ...prevExpenses[selectedTrip.id]?.[currentDayIndex],
          [category]: (prevExpenses[selectedTrip.id]?.[currentDayIndex]?.[category] || []).filter((_, i) => i !== index)
        }
      }
    }));
  };

  const calculateTotal = (category) => {
    return (expenses[selectedTrip.id]?.[currentDayIndex]?.[category] || [])
      .reduce((total, expense) => {
        const price = parseFloat(expense.price);
        return total + (isNaN(price) ? 0 : price);
      }, 0);
  };

  const calculateDayTotal = () => {
    const categories = ['lodging', 'food', 'transport', 'activities'];
    return categories.reduce((total, category) => total + calculateTotal(category), 0);
  };

  const getPlannedExpense = (category) => {
    if (!selectedTrip.days || selectedTrip.days.length === 0 || Object.keys(exchangeRates).length === 0) return 0;
    const day = selectedTrip.days[currentDayIndex];

    const convert = (amount, fromCurrency) => {
      if (fromCurrency === inputCurrency || !exchangeRates[fromCurrency] || !exchangeRates[inputCurrency]) {
        return amount;
      }
      return convertCurrency(amount, fromCurrency, inputCurrency, exchangeRates);
    };

    switch(category) {
      case 'lodging':
        return convert(
          parseFloat(day.accommodation?.price) || 0,
          day.accommodation?.currency || inputCurrency
        );
      case 'food':
        const breakfast = convert(
          (parseFloat(day.food?.petitDejeuner?.price) || 0) * (parseInt(day.food?.petitDejeuner?.count) || 1),
          day.food?.petitDejeuner?.currency || inputCurrency
        );
        const lunch = convert(
          (parseFloat(day.food?.dejeuner?.price) || 0) * (parseInt(day.food?.dejeuner?.count) || 1),
          day.food?.dejeuner?.currency || inputCurrency
        );
        const dinner = convert(
          (parseFloat(day.food?.diner?.price) || 0) * (parseInt(day.food?.diner?.count) || 1),
          day.food?.diner?.currency || inputCurrency
        );
        return breakfast + lunch + dinner;
      case 'transport':
        return (day.transports || []).reduce((total, t) => 
          total + convert(
            (parseFloat(t.price) || 0) * (parseInt(t.count) || 1),
            t.currency || inputCurrency
          ), 0);
      case 'activities':
        return (day.activities || []).reduce((total, a) => 
          total + convert(
            (parseFloat(a.price) || 0) * (parseInt(a.count) || 1),
            a.currency || inputCurrency
          ), 0);
      default:
        return 0;
    }
  };


  const handleNumberInput = (e) => {
    e.target.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    e.target.addEventListener('keydown', (e) => {
      if (e.which === 38 || e.which === 40) e.preventDefault();
    });
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }
  
  if (!selectedTrip?.days || selectedTrip.days.length === 0) {
    return (
      <div className="p-4 bg-gray-100 min-h-screen">
        <h2 className="text-2xl font-bold text-center mb-4">Aucune journée n'a été ajoutée à ce voyage</h2>
        <p className="text-center mb-4">Ajoutez d'abord une journée avant d'ajouter des dépenses.</p>
        <button 
          onClick={() => handlePageChange('tripDetail')} 
          className="bg-blue-500 text-white p-3 rounded-lg w-full hover:bg-blue-600 transition-colors"
        >
          Retour aux détails du voyage
        </button>
      </div>
    );
  }

  const renderExpenseTable = (category, title) => (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-md">
      <h3 className="font-bold text-lg mb-4 text-gray-800">{title}</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 p-3 bg-gray-100 rounded-lg">
          <h4 className="font-semibold mb-2 text-gray-700 text-lg underline">Prévision</h4>
          <p className="text-lg">{getPlannedExpense(category).toFixed(2)} {inputCurrency}</p>
        </div>
        <div className="col-span-3 p-3 bg-gray-100 rounded-lg">
          <h4 className="font-semibold mb-2 text-gray-700 text-lg underline">Réel</h4>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Description</th>
                <th className="text-left">Prix</th>
                <th className="text-left">Devise</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(expenses[selectedTrip.id]?.[currentDayIndex]?.[category] || []).map((expense, index) => (
                <tr key={`${category}-${index}`}>
                  <td>
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => updateExpense(category, index, 'description', e.target.value)}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={expense.price === null ? '' : expense.price}
                      onChange={(e) => updateExpense(category, index, 'price', e.target.value)}
                      onFocus={handleNumberInput}
                      min="0"
                      step="0.01"
                      className="w-full p-1 border rounded no-spinner"
                    />
                  </td>
                  <td>{inputCurrency}</td>
                  <td>
                    <button 
                      onClick={() => removeExpense(category, index)} 
                      className="text-red-500"
                      aria-label={`Supprimer la dépense ${expense.description || ''}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            onClick={() => addExpense(category)} 
            className="mt-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            aria-label={`Ajouter une dépense pour ${title}`}
          >
            <Plus size={20} />
          </button>
          <div className="mt-2 font-bold text-right">
            Total: {calculateTotal(category).toFixed(2)} {inputCurrency}
          </div>
        </div>
      </div>
    </div>
  );


  const dayTotal = calculateDayTotal();
  const plannedDayTotal = getPlannedExpense('lodging') + getPlannedExpense('food') + getPlannedExpense('transport') + getPlannedExpense('activities');

  const chartData = [
    { name: 'Prévision', value: plannedDayTotal },
    { name: 'Réel', value: dayTotal },
  ];

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <style>{styles}</style>
      <div 
        className="text-xl font-bold mb-6 p-3 rounded-lg shadow-md"
        style={{
          backgroundColor: selectedTrip.color,
          color: selectedTrip.textColor,
          fontFamily: selectedTrip.font
        }}
      >
        {selectedTrip.name}
      </div>

      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Jour {currentDayIndex + 1}
        </h2>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigateDay(-1)} 
          disabled={currentDayIndex === 0} 
          className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Jour précédent"
        >
          <ArrowLeft size={24} />
        </button>
        <h3 className="text-xl font-semibold text-gray-800">
          {format(new Date(selectedTrip.days[currentDayIndex].date), 'EEEE d MMMM yyyy', { locale: fr }).replace(/^\w/, c => c.toUpperCase())}
        </h3>
        <button 
          onClick={() => navigateDay(1)} 
          disabled={currentDayIndex === selectedTrip.days.length - 1} 
          className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Jour suivant"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      <button 
        onClick={() => handlePageChange('tripDetail')} 
        className="bg-gray-500 text-white p-3 rounded-lg w-full mb-6 hover:bg-gray-600 transition-colors"
      >
        <Home className="mr-2 inline" />Retour
      </button>

      {renderExpenseTable('lodging', 'Logement')}
      {renderExpenseTable('food', 'Nourriture')}
      {renderExpenseTable('transport', 'Transports')}
      {renderExpenseTable('activities', 'Activités / Extras')}

      <div className="mt-6 font-bold text-xl bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-center mb-12 text-gray-800">Total de la journée</h3>
        <div className="flex justify-center items-end h-64 space-x-4 pt-4">
          {chartData.map((data, index) => (
            <div key={data.name} className="flex flex-col items-center">
              <div className="text-center mb-2">
                {data.value.toFixed(2)}
                <br />
                {inputCurrency}
                </div>
              <div 
                style={{
                  height: `${(data.value / Math.max(...chartData.map(d => d.value))) * 200}px`,
                  width: '60px',
                  backgroundColor: index === 0 
                    ? selectedTrip.color 
                    : (data.value > chartData[0].value ? '#FF0000' : '#00FF00')
                }}
              />
              <div className="text-center mt-2">{data.name}</div>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={() => handlePageChange('tripDetail')} 
        className="bg-gray-500 text-white p-3 rounded-lg w-full mt-6 hover:bg-gray-600 transition-colors"
      >
        <Home className="mr-2 inline" />Retour
      </button>
    </div>
  );
};

export default RealExpensesPage;