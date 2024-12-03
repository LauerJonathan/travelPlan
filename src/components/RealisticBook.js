import React from 'react';

const RealisticBook = ({ trip, onClick }) => {
  const minHeight = 150;
  const maxHeight = minHeight * 1.333;
  const minWidth = 30;
  const maxWidth = 120;

  const height = Math.min(maxHeight, minHeight + (trip.days?.length || 0));
  const width = Math.min(maxWidth, minWidth + trip.name.length * 0.5);
  const rotation = Math.random() * 6 - 3; // Rotation aléatoire entre -3 et 3 degrés

  const renderText = (text) => {
    const words = text.split(' ');
    const midpoint = Math.ceil(words.length / 2);
    const firstLine = words.slice(0, midpoint).join(' ');
    const secondLine = words.slice(midpoint).join(' ');
  
    return (
      <>
        <div>{renderLine(firstLine)}</div>
        {secondLine && <div>{renderLine(secondLine)}</div>}
      </>
    );
  };
  
  const renderLine = (line) => {
    return line.split('').map((char, index) => {
      const isEmoji = /\p{Emoji}/u.test(char);
      return (
        <span 
          key={index} 
          style={{ 
            display: 'inline-block',
            transform: isEmoji ? 'rotate(90deg)' : 'none',
            whiteSpace: 'pre'  // Ceci préservera les espaces
          }}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div 
      className="book cursor-pointer"
      style={{
        height: `${height}px`,
        width: `${width}px`,
        backgroundColor: trip.color,
        transform: `rotate(${rotation}deg)`,
        marginBottom: '-10px', // Pour compenser la rotation
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '0 2px 2px 0',
        boxShadow: '2px 2px 4px rgba(0,0,0,0.3), -1px -1px 1px rgba(255,255,255,0.2) inset',
      }}
      onClick={() => onClick(trip)}
    >
      <div style={{ height: '5px', backgroundColor: '#e0e0e0' }} />
      <div
        style={{
          flex: 1,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          fontFamily: trip.font,
          color: trip.textColor,
          padding: '5px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {renderText(trip.name)}
      </div>
      <div style={{ height: '5px', backgroundColor: '#e0e0e0' }} />
    </div>
  );
};

export default RealisticBook;