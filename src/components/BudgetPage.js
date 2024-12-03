import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getExchangeRates, convertCurrency } from '../utils/currencyUtils';

const BudgetPage = ({ selectedTrip, handlePageChange, expenses }) => {
  const [exchangeRates, setExchangeRates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const displayCurrency = localStorage.getItem(`displayCurrency_${selectedTrip.id}`) || 'EUR';

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const rates = await getExchangeRates();
        setExchangeRates(rates);
        setIsLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des taux de change:", error);
        setIsLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  const categoryTranslations = {
    lodging: 'Logement',
    food: 'Nourriture',
    transport: 'Transports',
    activities: 'Activités'
  };

  const calculateBudget = (isPlanned) => {
    let total = { lodging: 0, food: 0, transport: 0, activities: 0 };

    selectedTrip.days.forEach((day, index) => {
      if (isPlanned) {
        // Calcul du budget prévisionnel
        total.lodging += convertCurrency(Number(day.accommodation?.price) || 0, day.currency || 'EUR', displayCurrency, exchangeRates);
        total.food += ['petitDejeuner', 'dejeuner', 'diner'].reduce((mealTotal, meal) => 
          mealTotal + convertCurrency((Number(day.food?.[meal]?.price) || 0) * (Number(day.food?.[meal]?.count) || 1), day.currency || 'EUR', displayCurrency, exchangeRates), 0);
        total.transport += (day.transports || []).reduce((transportTotal, t) => 
          transportTotal + convertCurrency((Number(t.price) || 0) * (Number(t.count) || 1), day.currency || 'EUR', displayCurrency, exchangeRates), 0);
        total.activities += (day.activities || []).reduce((activityTotal, a) => 
          activityTotal + convertCurrency((Number(a.price) || 0) * (Number(a.count) || 1), day.currency || 'EUR', displayCurrency, exchangeRates), 0);
      } else {
        // Calcul du budget réel
        const dayExpenses = expenses[selectedTrip.id]?.[index] || {};
        total.lodging += (dayExpenses.lodging || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
        total.food += (dayExpenses.food || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
        total.transport += (dayExpenses.transport || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
        total.activities += (dayExpenses.activities || []).reduce((sum, e) => sum + (Number(e.price) || 0), 0);
      }
    });

    return total;
  };

  const plannedBudget = calculateBudget(true);
  const realBudget = calculateBudget(false);

  const createChartData = (budget) => {
    return Object.entries(budget).map(([key, value]) => ({
      name: categoryTranslations[key],
      value: value
    }));
  };

  const plannedChartData = createChartData(plannedBudget);
  const realChartData = createChartData(realBudget);

  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'];

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}% (${value.toFixed(2)} ${displayCurrency})`}
      </text>
    );
  };

  if (isLoading) {
    return <div>Chargement des données...</div>;
  }

  return (
    <div className="app flex flex-col min-h-screen">
      <main className="flex-grow p-4">
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

        <button 
          onClick={() => handlePageChange('tripDetail')} 
          className="mb-4 bg-gray-500 text-white p-2 rounded w-full flex items-center justify-center"
        >
          <Home className="mr-2" />Retour
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Budget prévisionnel du voyage</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={plannedChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {plannedChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)} ${displayCurrency}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center mt-4">
            Total prévu : {Object.values(plannedBudget).reduce((a, b) => a + b, 0).toFixed(2)} {displayCurrency}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Budget réel du voyage</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={realChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {realChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)} ${displayCurrency}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center mt-4">
            Total réel : {Object.values(realBudget).reduce((a, b) => a + b, 0).toFixed(2)} {displayCurrency}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Bilan</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Catégorie</th>
                <th className="border p-2">Prévu</th>
                <th className="border p-2">Réel</th>
                <th className="border p-2">Différence</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(plannedBudget).map(category => {
                const difference = plannedBudget[category] - realBudget[category];
                return (
                  <tr key={category}>
                    <td className="border p-2">{categoryTranslations[category]}</td>
                    <td className="border p-2">{plannedBudget[category].toFixed(2)} {displayCurrency}</td>
                    <td className="border p-2">{realBudget[category].toFixed(2)} {displayCurrency}</td>
                    <td className={`border p-2 ${difference < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {difference.toFixed(2)} {displayCurrency}
                    </td>
                  </tr>
                );
              })}
              <tr className="font-bold">
                <td className="border p-2">Total</td>
                <td className="border p-2">
                  {Object.values(plannedBudget).reduce((a, b) => a + b, 0).toFixed(2)} {displayCurrency}
                </td>
                <td className="border p-2">
                  {Object.values(realBudget).reduce((a, b) => a + b, 0).toFixed(2)} {displayCurrency}
                </td>
                <td className={`border p-2 ${
                  Object.values(plannedBudget).reduce((a, b) => a + b, 0) - Object.values(realBudget).reduce((a, b) => a + b, 0) < 0 
                    ? 'text-red-500' 
                    : 'text-green-500'
                }`}>
                  {(Object.values(plannedBudget).reduce((a, b) => a + b, 0) - 
                    Object.values(realBudget).reduce((a, b) => a + b, 0)).toFixed(2)} {displayCurrency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button 
          onClick={() => handlePageChange('tripDetail')} 
          className="mt-4 bg-gray-500 text-white p-2 rounded w-full flex items-center justify-center"
        >
          <Home className="mr-2" />Retour
        </button>
      </main>
    </div>
  );
};

export default BudgetPage;