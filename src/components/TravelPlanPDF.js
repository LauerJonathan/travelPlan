import React, { useMemo } from 'react';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';

// Enregistrement de la police par défaut
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

// Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Roboto',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 12,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: 'grey',
  },
});

// Fonction pour formater les dates
const formatDate = (date) => {
  if (!date) return 'Date non spécifiée';
  const parsedDate = new Date(date);
  return isValid(parsedDate) ? format(parsedDate, 'dd/MM/yyyy', { locale: fr }) : 'Date invalide';
};

// Composant pour la page de garde simplifié
const CoverPage = ({ trip }) => (
  <Page size="A4" style={styles.page}>
    <Text style={styles.header}>{trip.name}</Text>
    <Text style={styles.text}>
      Du {formatDate(trip.days[0]?.date)} au {formatDate(trip.days[trip.days.length - 1]?.date)}
    </Text>
    <Text style={styles.text}>
      {trip.days.length} Jours
    </Text>
    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
      `${pageNumber} / ${totalPages}`
    )} fixed />
  </Page>
);

// Composant principal TravelPlanPDF
const TravelPlanPDF = React.memo(({ trip, expenses }) => {
  const pages = useMemo(() => {
    return [
      <CoverPage key="cover" trip={trip} />,
      // Ajoutez d'autres pages ici si nécessaire
    ];
  }, [trip]);

  return (
    <Document>
      {pages}
    </Document>
  );
});

export default TravelPlanPDF;