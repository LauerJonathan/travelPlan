// React et hooks
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import html2canvas from 'html2canvas';

// Icônes Lucide
import {
  PlusCircle,
  Info,
  Trash2,
  Calendar,
  MapPin,
  ArrowUp,
  ArrowDown,
  DollarSign,
  FileText,
  Edit,
  Home,
  Camera,
} from 'lucide-react';

// Composants personnalisés
import TripMap from './TripMap';
import WorldMap from './WorldMap';
import AutocompleteLocationInput from './AutocompleteLocationInput';
import RealisticBook from './components/RealisticBook';
import ColorPicker, { TextColorPicker } from './components/ColorPicker';
import DayDetail from './components/DayDetail';
import BudgetPage from './components/BudgetPage';
import RealExpensesPage from './RealExpensesPage';
import TravelPlanPDF from './components/TravelPlanPDF';
import logo from './images/logo.png';

// Styles et ressources
import './Bookshelf.css';
import woodTexture from './images/wood-texture.jpg';
import './App.css';

const fonts = [
'Arial', 'Verdana', 'Georgia', 'Times New Roman', 'Courier New', 
  'Algerian', 'Blackadder ITC', 'Britannic Bold', 'Brush Script MT', 
  'Cascadia Code', 'Curlz MT', 'Footlight MT Light', 'French Script MT', 
  'Harlow Solid Italic', 'Imprint MT Shadow', 'Ink Free', 'Jokerman', 
  'Lucida Calligraphy', 'MingLiU_HKSCS-ExtB', 'Old English Text MT', 
  'Vivaldi', 'Papyrus', 'STCaiyun', 'Bauhaus 93', 'Chiller', 'Colonna MT',
   'Copperplate Gothic Bold', 'Edwardian Script ITC', 'Engravers MT', 'Forte',
    'Freestyle Script', 'Harrington', 'Parchment', 'MV Boli', 'Rage Italic'
];

const TravelPlanApp = () => {
  const [trips, setTrips] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [editingDayId, setEditingDayId] = useState(null);
  const [isEditingAppearance, setIsEditingAppearance] = useState(false);
  //const [editingNoteId, setEditingNoteId] = useState(null);
  const dayCardRef = useRef(null);
  const [newTripData, setNewTripData] = useState({ name: '', color: '#000000', font: 'Arial', textColor: '#FFFFFF' });
  const [selectedDayId, setSelectedDayId] = useState(null);
 // const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [newTripError, setNewTripError] = useState('');
  const [expenses, setExpenses] = useState(() => {
    const savedExpenses = localStorage.getItem('expenses');
    return savedExpenses ? JSON.parse(savedExpenses) : {};
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapImage, setMapImage] = useState(null);
  const mapRef = useRef(null);
  const [pdfReady, setPdfReady] = useState(false);
const [pdfTrip, setPdfTrip] = useState(null);
  
  const captureMap = async () => {
    if (mapRef.current && isMapReady) {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mapElement = mapRef.current.querySelector('.leaflet-map-pane');
        if (!mapElement) {
          console.error("Élément de carte Leaflet non trouvé");
          return null;
        }
  
        const canvas = await html2canvas(mapElement, {
          useCORS: true,
          allowTaint: true,
          logging: true,
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight,
          scale: 2,
          backgroundColor: null,
        });
  
        return canvas.toDataURL('image/png');
      } catch (error) {
        console.error("Erreur lors de la capture de la carte:", error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const savedTrips = JSON.parse(localStorage.getItem('trips')) || [];
    setTrips(savedTrips);
  }, []);

  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handlePageChange = (newPage, params = {}) => {
    if (newPage === 'realExpenses') {
      setSelectedDayId(params.selectedDayId);
    }
    setCurrentPage(newPage);
  };

  const updateTrip = (updatedTrip) => {
    setSelectedTrip(updatedTrip);
    setTrips(prevTrips => {
      const newTrips = prevTrips.map(trip => 
        trip.id === updatedTrip.id ? updatedTrip : trip
      );
      localStorage.setItem('trips', JSON.stringify(newTrips));
      return newTrips;
    });
  };
  
  const handlePDFGeneration = async () => {
    try {
      setPdfReady(false);
      const mapImage = await captureMap();
      const updatedTrip = { ...selectedTrip, mapImage };
      setPdfTrip(updatedTrip);
      setPdfReady(true);
    } catch (error) {
      console.error("Erreur lors de la préparation du PDF:", error);
      // Afficher un message d'erreur à l'utilisateur
    }
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result.toISOString().split('T')[0];
  };

  const getNewDayName = (existingDays) => {
    let dayName = 'Nouveau jour';
    let counter = 1;
    // eslint-disable-next-line no-loop-func
    while (existingDays.some(day => day.name === dayName)) {
      dayName = `Nouveau jour ${counter}`;
      counter++;
    }
    return dayName;
  };

  const addDay = () => {
    if (!selectedTrip) return;
  
    const lastDay = selectedTrip.days[selectedTrip.days.length - 1];
    const newDate = lastDay ? addDays(lastDay.date, 1) : new Date().toISOString().split('T')[0];
    
    const newDayName = getNewDayName(selectedTrip.days);
    const newDay = { id: Date.now(), name: newDayName, date: newDate, location: { name: '', lat: null, lon: null } };
    
    const updatedTrip = {
      ...selectedTrip,
      days: [...selectedTrip.days, newDay]
    };
    
    updateTrip(updatedTrip);
  };

  const moveDay = (fromIndex, toIndex) => {
    setSelectedTrip(prevTrip => {
      const newDays = [...prevTrip.days];
      const [removed] = newDays.splice(fromIndex, 1);
      newDays.splice(toIndex, 0, removed);
      newDays.forEach((day, index) => {
        if (index > 0) {
          day.date = addDays(newDays[0].date, index);
        }
      });
      const updatedTrip = {...prevTrip, days: newDays};
      
      setTrips(prevTrips => {
        const newTrips = prevTrips.map(trip => 
          trip.id === updatedTrip.id ? updatedTrip : trip
        );
        localStorage.setItem('trips', JSON.stringify(newTrips));
        return newTrips;
      });
  
      return updatedTrip;
    });
  };
  
  const updateDay = (dayId, updates) => {
    if (!selectedTrip) return;
  
    const updatedDays = selectedTrip.days.map((day) => {
      if (day.id === dayId) {
        return { 
          ...day, 
          ...updates,
          accommodation: {
            ...day.accommodation,
            ...updates.accommodation
          },
          generalInfo: {
            ...day.generalInfo,
            ...updates.generalInfo
          },
          food: {
            ...day.food,
            ...updates.food
          },
          transports: updates.transports ? [...(day.transports || []), ...updates.transports] : day.transports,
          activities: updates.activities ? [...(day.activities || []), ...updates.activities] : day.activities
        };
      }
      return day;
    });
  
    if (updates.date) {
      const updatedIndex = updatedDays.findIndex(day => day.id === dayId);
      const newDate = new Date(updates.date);
  
      // Update following dates
      for (let i = updatedIndex + 1; i < updatedDays.length; i++) {
        newDate.setDate(newDate.getDate() + 1);
        updatedDays[i].date = newDate.toISOString().split('T')[0];
      }
  
      // Update previous dates
      newDate.setDate(new Date(updates.date).getDate());
      for (let i = updatedIndex - 1; i >= 0; i--) {
        newDate.setDate(newDate.getDate() - 1);
        updatedDays[i].date = newDate.toISOString().split('T')[0];
      }
    }
  
    const updatedTrip = {
      ...selectedTrip,
      days: updatedDays
    };
  
    setSelectedTrip(updatedTrip);
    setTrips(prevTrips => {
      const newTrips = prevTrips.map(trip => 
        trip.id === updatedTrip.id ? updatedTrip : trip
      );
      localStorage.setItem('trips', JSON.stringify(newTrips));
      return newTrips;
    });
  };

  const deleteTrip = () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le voyage "${selectedTrip.name}" ?`)) {
      setTrips(prevTrips => {
        const updatedTrips = prevTrips.filter(trip => trip.id !== selectedTrip.id);
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
        return updatedTrips;
      });
      setSelectedTrip(null);
      handlePageChange('home');
    }
  };

  const deleteDay = (dayId) => {
    const updatedDays = selectedTrip.days.filter(day => day.id !== dayId);
    updatedDays.forEach((day, index) => {
      if (index > 0) {
        day.date = addDays(updatedDays[0].date, index);
      }
    });
    const updatedTrip = {
      ...selectedTrip,
      days: updatedDays
    };
    updateTrip(updatedTrip);
  };

  const addNote = () => {
    if (!selectedTrip) return;
  
    const newNote = {
      id: Date.now(),
      title: 'Nouvelle note',
      content: ''
    };
  
    const updatedTrip = {
      ...selectedTrip,
      notes: [...(selectedTrip.notes || []), newNote]
    };
  
    updateTrip(updatedTrip);
  };
  
  const updateNote = (noteId, updates) => {
    if (!selectedTrip) return;
  
    const updatedTrip = {
      ...selectedTrip,
      notes: selectedTrip.notes.map(note => 
        note.id === noteId ? { ...note, ...updates } : note
      )
    };
  
    updateTrip(updatedTrip);
  };
  
  const deleteNote = (noteId) => {
    if (!selectedTrip) return;
  
    const updatedTrip = {
      ...selectedTrip,
      notes: selectedTrip.notes.filter(note => note.id !== noteId)
    };
  
    updateTrip(updatedTrip);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const renderHome = () => (
    <div className="flex flex-col h-screen">
      <div className="world-map-container w-full overflow-hidden mb-4" style={{ height: '40vh', minHeight: '200px' }}>
        <WorldMap trips={trips} />
      </div>
      <div className="flex-grow flex flex-col">
        <div className="bookshelf-container mb-4">
          <div 
            className="bookshelf"
            style={{ backgroundImage: `url(${woodTexture})` }}
          >
            {trips.map((trip) => (
              <RealisticBook 
                key={trip.id} 
                trip={trip} 
                onClick={(selectedTrip) => {
                  setSelectedTrip(selectedTrip);
                  handlePageChange('tripDetail');
                }}
              />
            ))}
          </div>
        </div>
        <button 
        onClick={() => handlePageChange('newTrip')}
        className="bg-green-500 text-white px-6 py-2 rounded-full flex items-center justify-center"
        >
          <PlusCircle className="mr-2" />Ajouter un voyage
        </button>
      </div>
    </div>
  );

  const addTransport = (dayId) => {
    const updatedTrip = { ...selectedTrip };
    const dayIndex = updatedTrip.days.findIndex(day => day.id === dayId);
    if (dayIndex !== -1) {
      const newTransport = {
        id: Date.now(),
        type: 'car', // Type par défaut
        description: '',
        price: ''
      };
      updatedTrip.days[dayIndex].transports = [
        ...(updatedTrip.days[dayIndex].transports || []),
        newTransport
      ];
      updateTrip(updatedTrip);
    }
  };
  
  const updateTransport = (dayId, transportId, updates) => {
    const updatedTrip = { ...selectedTrip };
    const dayIndex = updatedTrip.days.findIndex(day => day.id === dayId);
    if (dayIndex !== -1) {
      updatedTrip.days[dayIndex].transports = updatedTrip.days[dayIndex].transports.map(transport =>
        transport.id === transportId ? { 
          ...transport, 
          ...updates,
          price: updates.price === '' ? '' : updates.price // Permet les valeurs vides
        } : transport
      );
      updateTrip(updatedTrip);
    }
  };
  
  
  const removeTransport = (dayId, transportId) => {
    const updatedTrip = { ...selectedTrip };
    const dayIndex = updatedTrip.days.findIndex(day => day.id === dayId);
    if (dayIndex !== -1) {
      updatedTrip.days[dayIndex].transports = updatedTrip.days[dayIndex].transports.filter(t => t.id !== transportId);
      updateTrip(updatedTrip);
    }
  };
  
  const addActivity = (dayId) => {
    const updatedTrip = { ...selectedTrip };
    const dayIndex = updatedTrip.days.findIndex(day => day.id === dayId);
    if (dayIndex !== -1) {
      const newActivity = {
        id: Date.now(),
        description: '',
        price: ''
      };
      updatedTrip.days[dayIndex].activities = [
        ...(updatedTrip.days[dayIndex].activities || []),
        newActivity
      ];
      updateTrip(updatedTrip);
    }
  };
  
  const updateActivity = (dayId, activityId, updates) => {
    const updatedTrip = { ...selectedTrip };
    const dayIndex = updatedTrip.days.findIndex(day => day.id === dayId);
    if (dayIndex !== -1) {
      updatedTrip.days[dayIndex].activities = updatedTrip.days[dayIndex].activities.map(activity =>
        activity.id === activityId ? { 
          ...activity, 
          ...updates,
          price: updates.price === '' ? '' : updates.price // Permet les valeurs vides
        } : activity
      );
      updateTrip(updatedTrip);
    }
  };


  const removeActivity = (dayId, activityId) => {
    const updatedTrip = { ...selectedTrip };
    const dayIndex = updatedTrip.days.findIndex(day => day.id === dayId);
    if (dayIndex !== -1) {
      updatedTrip.days[dayIndex].activities = updatedTrip.days[dayIndex].activities.filter(a => a.id !== activityId);
      updateTrip(updatedTrip);
    }
  };

  const handleClickOutside = useCallback((event) => {
    if (dayCardRef.current && !dayCardRef.current.contains(event.target)) {
      setEditingDayId(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const renderTripDetail = () => {
    if (!selectedTrip || !selectedTrip.days) {
      return <div>Chargement des détails du voyage...</div>;
    }
  
    const updateDayWithDateRecalculation = (dayId, updates) => {
      const updatedDays = selectedTrip.days.map((day) => {
        if (day.id === dayId) {
          return { ...day, ...updates };
        }
        return day;
      });
  
      if (updates.date) {
        const updatedIndex = updatedDays.findIndex(day => day.id === dayId);
        const newDate = new Date(updates.date);
  
        // Update following dates
        for (let i = updatedIndex + 1; i < updatedDays.length; i++) {
          newDate.setDate(newDate.getDate() + 1);
          updatedDays[i].date = newDate.toISOString().split('T')[0];
        }
  
        // Update previous dates
        newDate.setDate(new Date(updates.date).getDate());
        for (let i = updatedIndex - 1; i >= 0; i--) {
          newDate.setDate(newDate.getDate() - 1);
          updatedDays[i].date = newDate.toISOString().split('T')[0];
        }
      }
  
      updateTrip({ ...selectedTrip, days: updatedDays });
    };
  
    return (
      <div>
        {isEditingAppearance ? (
          <div className="flex flex-col">
            <div className="w-full mb-4">
              <h3 className="text-lg font-bold mb-2">Nom du voyage:</h3>
              <input
                type="text"
                value={selectedTrip.name}
                onChange={(e) => updateTrip({...selectedTrip, name: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex">
              <div className="w-1/2 pr-4">
                <h3 className="text-lg font-bold mb-2">Couleur du livre:</h3>
                <ColorPicker
                  name="bookColor"
                  value={selectedTrip.color}
                  onChange={(color) => updateTrip({...selectedTrip, color})}
                />
                <h3 className="text-lg font-bold mb-2 mt-4">Couleur de la police:</h3>
                <TextColorPicker
                  name="textColor"
                  value={selectedTrip.textColor}
                  onChange={(textColor) => updateTrip({...selectedTrip, textColor})}
                />
                <h3 className="text-lg font-bold mb-2 mt-4">Police:</h3>
                <select
                  id="tripFont"
                  name="tripFont"
                  value={selectedTrip.font}
                  onChange={(e) => updateTrip({...selectedTrip, font: e.target.value})}
                  className="w-full p-2 border rounded mb-4"
                  disabled={!selectedTrip.name}
                >
                  {fonts.map(font => (
                    <option key={font} value={font} style={{fontFamily: font}}>
                      {selectedTrip.name || font}
                    </option>
                  ))}
                </select>
                <button onClick={() => setIsEditingAppearance(false)} className="bg-blue-500 text-white p-2 rounded mt-4 mb-8">
                  Sauvegarder les modifications
                </button>
              </div>
              <div className="w-1/2 pl-4">
                <h3 className="text-lg font-bold mb-4">Aperçu:</h3>
                <RealisticBook trip={selectedTrip} onClick={() => {}} />
              </div>
            </div>
          </div>
        ) : (
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
        )}
    
        {/* Conteneur spécifique pour la carte avec une hauteur fixe */}
        <div ref={mapRef} className="mb-4" style={{ width: '100%', height: '400px', position: 'relative', backgroundColor: 'white' }}>
          {currentPage === 'tripDetail' && selectedTrip.days && selectedTrip.days.length > 0 ? (
            <TripMap
              days={selectedTrip.days}
              color={selectedTrip.color}
              key={selectedTrip.days.map(day => `${day.id}-${day.location.name}`).join(',')}
              onMapReady={() => setIsMapReady(true)}
            />
          ) : (
            <div>Aucun jour planifié pour ce voyage.</div>
          )}
        </div>
    
        {/* Bouton "Retour" au-dessus */}
        <button onClick={() => handlePageChange('home')} className="bg-gray-500 text-white p-2 rounded mb-4 w-full">
          <Home className="mr-2 inline" />Retour
        </button>
    
        <div className="mb-4 space-x-4 flex flex-wrap justify-center items-center">
  <button 
    onClick={() => handlePageChange('realExpenses', { selectedDayId: selectedTrip.days[0]?.id })} 
    className="bg-blue-800 text-white p-2 rounded flex items-center justify-center m-2"
    style={{ minWidth: '120px', height: '40px' }}
  >
    <PlusCircle className="mr-2" />Ajouter une dépense
  </button>

          <button onClick={() => handlePageChange('notes')} className="bg-blue-500 text-white p-2 rounded flex items-center inline-flex m-2">
            <Info className="mr-2" />Notes
          </button>

          <button onClick={() => handlePageChange('budget')} className="bg-yellow-500 text-white p-2 rounded flex items-center inline-flex m-2">
            <DollarSign className="mr-2" />Budget
          </button>

          {!pdfReady ? (
  <button 
    onClick={handlePDFGeneration}
    className="bg-purple-500 text-white p-2 rounded flex items-center inline-flex m-2"
  >
    <FileText className="mr-2" />
    Préparer le PDF
  </button>
) : (
<PDFDownloadLink
  document={<TravelPlanPDF trip={pdfTrip} expenses={expenses[selectedTrip.id] || {}} />}
  fileName={`TravelPlan_${selectedTrip.name}.pdf`}
>
  {({ blob, url, loading, error }) => (
    <button 
      onClick={() => {
        if (error) {
          console.error("Erreur lors de la génération du PDF:", error);
        }
      }}
      className="bg-purple-500 text-white p-2 rounded flex items-center inline-flex m-2"
      disabled={loading}
    >
      <FileText className="mr-2" />
      {loading ? 'Chargement...' : error ? 'Erreur' : 'Télécharger TravelPlan'}
    </button>
  )}
</PDFDownloadLink>
)}

          <button onClick={() => {setIsEditingAppearance(true); scrollToTop();}} 
            className="bg-indigo-500 text-white p-2 rounded flex items-center inline-flex m-2">
            <Edit className="mr-2" />Modifier
          </button>
          <button onClick={deleteTrip} className="bg-red-500 text-white p-2 rounded flex items-center inline-flex m-2">
            <Trash2 className="mr-2" />Supprimer
          </button>
        </div>
  
        <div className="space-y-4">
          {selectedTrip.days.map((day, index) => (
            <div 
              key={day.id} 
              className="bg-white shadow-md rounded-lg p-4 cursor-pointer flex items-center"
              onClick={() => setEditingDayId(day.id)}
              ref={editingDayId === day.id ? dayCardRef : null}
            >
              {/* Image à gauche */}
              <div className="w-24 h-24 mr-4 flex-shrink-0">
                {day.image ? (
                  <img src={day.image} alt={day.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
  
              {/* Informations au centre */}
              <div className="flex-grow">
              {editingDayId === day.id ? (
  <>
    <label htmlFor={`dayName-${day.id}`} className="sr-only">Nom de la journée</label>
    <input
      id={`dayName-${day.id}`}
      name={`dayName-${day.id}`}
      type="text"
      value={day.name}
      onChange={(e) => updateDayWithDateRecalculation(day.id, { name: e.target.value })}
      className="w-full p-2 border rounded mb-2"
      onClick={(e) => e.stopPropagation()}
    />
    <label htmlFor={`dayDate-${day.id}`} className="sr-only">Date de la journée</label>
    <input
      id={`dayDate-${day.id}`}
      name={`dayDate-${day.id}`}
      type="date"
      value={day.date}
      onChange={(e) => updateDayWithDateRecalculation(day.id, { date: e.target.value })}
      className="w-full p-2 border rounded mb-2"
      onClick={(e) => e.stopPropagation()}
    />
    <label htmlFor={`dayLocation-${day.id}`} className="sr-only">Localisation</label>
    <AutocompleteLocationInput
  id={`dayLocation-${day.id}`}
  name={`dayLocation-${day.id}`}
  value={day.location.name}
  onChange={(newLocation) => updateDayWithDateRecalculation(day.id, { location: newLocation })}
  onClick={(e) => e.stopPropagation()}
  className="w-full p-2 border rounded"
  placeholder="Entrez une localisation"
/>
  </>
) : (
  <>
    <span className="text-gray-500">Jour {index + 1}</span>
    <p className="font-bold">{day.name}</p>
    <p><Calendar className="inline mr-2" />{day.date}</p>
    <p><MapPin className="inline mr-2" />{day.location.name}</p>
  </>
)}
              </div>
  
              {/* Boutons à droite */}
              <div className="flex flex-col items-end">
                <div className="mb-2">
                  <button onClick={(e) => { e.stopPropagation(); moveDay(index, Math.max(0, index - 1)); }} disabled={index === 0} className="text-blue-500 mr-2">
                    <ArrowUp className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveDay(index, Math.min(selectedTrip.days.length - 1, index + 1)); }} disabled={index === selectedTrip.days.length - 1} className="text-blue-500 mr-2">
                    <ArrowDown className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteDay(day.id); }} className="text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <button 
  onClick={(e) => {
    e.stopPropagation();
    setSelectedDayId(day.id);
    handlePageChange('dayDetail');
  }} 
  className="bg-blue-500 text-white p-2 rounded w-32"
>
  Détails de la journée
</button>
              </div>
            </div>
          ))}
        </div>
  
        <div className="flex flex-col items-center mt-4 space-y-4">
        <button 
          onClick={addDay} 
          className="bg-green-500 text-white px-6 py-2 rounded-full flex items-center justify-center"
          style={{ width: 'fit-content' }}
        >
          <PlusCircle className="mr-2" />Ajouter une journée
        </button>

        {selectedTrip.days.length >= 2 && (
          <button onClick={() => handlePageChange('home')} className="bg-gray-500 text-white p-2 rounded w-full">
            <Home className="mr-2 inline" />Retour
          </button>
        )}
      </div>
    </div>
    );
  };
  
  const renderNewTrip = () => {
    const handleAddTrip = () => {
      const trimmedName = newTripData.name.trim();
      if (trimmedName === '') {
        setNewTripError('Le nom du voyage ne peut pas être vide.');
        return;
      }
  
      if (trips.some(trip => trip.name.toLowerCase() === trimmedName.toLowerCase())) {
        setNewTripError("Un voyage avec ce nom existe déjà. Veuillez choisir un nom différent.");
        return;
      }
  
      const newTrip = { ...newTripData, name: trimmedName, id: Date.now(), days: [], notes: [] };
      setTrips(prevTrips => {
        const updatedTrips = [...prevTrips, newTrip];
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
        return updatedTrips;
      });
      setNewTripData({ name: '', color: '#000000', font: 'Arial', textColor: '#FFFFFF' });
      setNewTripError('');
      handlePageChange('home');
    };
  
    return (
      <div className="flex flex-wrap">
        <div className="w-full mb-4">
          <h2 className="text-xl font-bold mb-4">Nouveau Voyage</h2>
          <label htmlFor="tripName" className="block mb-2">Nom du voyage:</label>
          <input 
            id="tripName"
            name="tripName"
            type="text" 
            value={newTripData.name} 
            onChange={(e) => {
              setNewTripData({...newTripData, name: e.target.value});
              setNewTripError('');
            }} 
            placeholder="Nom du voyage" 
            className="w-full p-2 border rounded mb-2"
          />
          {newTripError && <p className="text-red-500 mb-2">{newTripError}</p>}
        </div>
        <div className="w-1/2 pr-2">
          <div className="mb-4">
            <label className="block mb-2">
              Couleur du livre:
              <ColorPicker 
                name="bookColor"
                value={newTripData.color} 
                onChange={(color) => setNewTripData({...newTripData, color})}
              />
            </label>
          </div>
          <div className="mb-4">
            <label className="block mb-2">
              Couleur du texte:
              <TextColorPicker 
                name="textColor"
                value={newTripData.textColor} 
                onChange={(color) => setNewTripData({...newTripData, textColor: color})}
              />
            </label>
          </div>
          <div className="mb-4">
            <label htmlFor="fontSelect" className="block mb-2">Police:</label>
            <select 
              id="fontSelect"
              name="font"
              value={newTripData.font} 
              onChange={(e) => setNewTripData({...newTripData, font: e.target.value})} 
              className="w-full p-2 border rounded mb-4"
              disabled={!newTripData.name.trim()}
            >
              <option value="">Sélectionnez une police</option>
              {fonts.map(font => (
                <option key={font} value={font} style={{fontFamily: font}}>
                  {newTripData.name.trim() || font}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-1/2 pl-2">
          <div className="book-preview mb-4">
            <RealisticBook trip={newTripData} onClick={() => {}} />
          </div>
        </div>
        <div className="w-full">
          <button 
            onClick={handleAddTrip} 
            className="bg-blue-500 text-white p-2 rounded w-full mb-4"
            disabled={!newTripData.name.trim()}
          >
            Enregistrer
          </button>
          <button onClick={() => handlePageChange('home')} className="bg-gray-500 text-white p-2 rounded w-full flex items-center justify-center mb-4">
            <Home className="mr-2" />Retour
          </button>
        </div>
      </div>
    );
  };


/*  const renderDayDetail = () => {
    return (
      <DayDetail
        selectedTrip={selectedTrip}
        selectedDayId={selectedDayId}
        updateDay={updateDay}
        deleteDay={deleteDay}
        handlePageChange={handlePageChange}
        addTransport={addTransport}
        updateTransport={updateTransport}
        removeTransport={removeTransport}
        addActivity={addActivity}
        updateActivity={updateActivity}
        removeActivity={removeActivity}
        setSelectedDayId={setSelectedDayId}
      />
    );
  };*/

  const NotesComponent = ({ selectedTrip, updateNote, deleteNote, addNote, handlePageChange }) => {
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editingNoteContent, setEditingNoteContent] = useState({ title: '', content: '' });
    const editingNoteRef = useRef(null);
  
    const saveNote = useCallback(() => {
      if (editingNoteId !== null) {
        updateNote(editingNoteId, editingNoteContent);
        setEditingNoteId(null);
      }
    }, [editingNoteId, editingNoteContent, updateNote]);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (editingNoteRef.current && !editingNoteRef.current.contains(event.target)) {
          saveNote();
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [saveNote]);
  
    const startEditing = (note, event) => {
      event.stopPropagation();
      if (editingNoteId !== note.id) {
        saveNote(); // Save any previously edited note
        setEditingNoteId(note.id);
        setEditingNoteContent({ title: note.title, content: note.content });
      }
    };
  
    const handleNoteChange = (field, value) => {
      setEditingNoteContent(prev => ({ ...prev, [field]: value }));
    };
  
    return (
      <div className="flex flex-col h-full">
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
  
        <div className="flex-grow overflow-auto p-4">
          <div className="space-y-4">
            {selectedTrip.notes.map(note => (
              <div 
                key={note.id} 
                className="note-card mb-4 p-4 rounded bg-white shadow-md cursor-pointer"
                onClick={(e) => startEditing(note, e)}
                ref={editingNoteId === note.id ? editingNoteRef : null}
              >
                {editingNoteId === note.id ? (
                  <>
                    <input 
                      type="text" 
                      id={`note-title-${note.id}`}
                      name={`note-title-${note.id}`}
                      value={editingNoteContent.title} 
                      onChange={(e) => handleNoteChange('title', e.target.value)} 
                      className="w-full p-2 border rounded mb-2 font-bold" 
                      placeholder="Titre de la note" 
                      onClick={(e) => e.stopPropagation()}
                    />
                    <textarea 
                      id={`note-content-${note.id}`}
                      name={`note-content-${note.id}`}
                      value={editingNoteContent.content} 
                      onChange={(e) => handleNoteChange('content', e.target.value)} 
                      className="w-full p-2 border rounded" 
                      placeholder="Contenu de la note" 
                      rows="4"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="mt-2 flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }} 
                        className="bg-red-500 text-white p-2 rounded flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Supprimer
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-bold text-lg mb-2">{note.title}</h3>
                    <p className="text-gray-700">{note.content}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
  
        <div className="flex flex-col items-center mt-4 space-y-4">
          <button 
            onClick={addNote} 
            className="bg-green-500 text-white px-6 py-2 rounded-full flex items-center justify-center"
          >
            <PlusCircle className="mr-2" />Ajouter une note
          </button>
          <button 
            onClick={() => {
              saveNote();
              handlePageChange('tripDetail');
            }} 
            className="bg-gray-500 text-white p-2 rounded flex items-center justify-center w-full"
          >
            <Home className="mr-2" />Retour
          </button>
        </div>
      </div>
    );
  };
  

  const renderNotes = () => {
    return (
      <NotesComponent 
        selectedTrip={selectedTrip}
        updateNote={updateNote}
        deleteNote={deleteNote}
        addNote={addNote}
        handlePageChange={handlePageChange}
      />
    );
  };

return (
  <div className="app flex flex-col min-h-screen">
    <header className="bg-blue-500 text-white p-4">
      <h1 className="text-2xl font-bold">TravelPlan</h1>
    </header>
    <main className="flex-grow p-4">
      {currentPage === 'home' && renderHome()}
      {currentPage === 'tripDetail' && selectedTrip && renderTripDetail()}
      {currentPage === 'newTrip' && renderNewTrip()}
      {currentPage === 'notes' && selectedTrip && renderNotes()}
      {currentPage === 'budget' && selectedTrip && (
  <BudgetPage
    selectedTrip={selectedTrip}
    handlePageChange={handlePageChange}
    expenses={expenses}
  />
)}
      {currentPage === 'dayDetail' && selectedTrip && (
        <DayDetail
          selectedTrip={selectedTrip}
          selectedDayId={selectedDayId}
          updateDay={updateDay}
          deleteDay={deleteDay}
          handlePageChange={handlePageChange}
          addTransport={addTransport}
          updateTransport={updateTransport}
          removeTransport={removeTransport}
          addActivity={addActivity}
          updateActivity={updateActivity}
          removeActivity={removeActivity}
          setSelectedDayId={setSelectedDayId}
        />
      )}

{currentPage === 'realExpenses' && (
  <RealExpensesPage
    selectedTrip={selectedTrip}
    handlePageChange={handlePageChange}
    expenses={expenses}
    setExpenses={setExpenses}
    selectedDayId={selectedDayId}
  />
)}

      </main>
      <footer className="mt-auto p-4 text-center text-sm text-gray-500">
      <p>© 2024 TravelPlan. Données de localisation fournies par <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>.</p>
    </footer>
  </div>
);
};

export default TravelPlanApp;