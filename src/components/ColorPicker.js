import React from 'react';

const ColorPicker = ({ name, value, onChange }) => {
  const colorGroups = [
    //jaune
    ['#ffffdf', '#ffff9e', '#ffff00', '#cbcf00', '#ada86d', '#989477'],
    //orange
    ['#ffecd8', '#ffd8b3', '#ffc58d', '#ffb268', '#ff9f40', '#ff8c00'],
    //rouge
    ['#ffbfaa', '#ff7b5a', '#ff5232', '#ff0000', '#d11507', '#bb0b0b'],
    //rose
    ['#ffe1ec', '#ffc2da', '#ffa2c7', '#ff80b6', '#ff59a4', '#ff1493'],
    //violet
    ['#efddfb', '#debbf7', '#b878ed', '#a255e8', '#7327b8', '#461e6b'],
    //bleu
    ['#e4ebfc', '#c8d7f8', '#aac3f4', '#669eeb', '#318ce7', '#2234f0'],
    //bleu
    ['#c9ebf9', '#8bd8f3', '#26c4ec', '#297e97', '#2b5b94', '#00008b'],
    //vert
    ['#d8e4d3', '#b1caa9', '#8bb07f', '#659658', '#3d7d30', '#006400'],
    //brun
    ['#e4dbd3', '#c9b9a9', '#ae9880', '#93775a', '#775935', '#5b3c11'],
    //gris
    ['#FFFFFF', '#d0d0d0', '#a2a2a2', '#777777', '#4e4e4e', '#000000']
  ];

  return (
    <div className="space-y-2">
      {colorGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex space-x-1">
          {group.map((color) => (
            <button
              key={color}
              id={`${name}-${color.substring(1)}`}
              name={`${name}-${color.substring(1)}`}
              className="w-6 h-6 rounded-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              style={{ 
                backgroundColor: color, 
                border: color === value ? '2px solid black' : 'none' 
              }}
              onClick={() => onChange(color)}
              aria-label={`Sélectionner la couleur ${color}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const TextColorPicker = ({ name, value, onChange }) => {
  const textColors = ['#FFFFFF', '#000000', '#808080'];
  
  return (
    <div className="flex space-x-2">
      {textColors.map((color) => (
        <button
          key={color}
          id={`${name}-${color.substring(1)}`}
          name={`${name}-${color.substring(1)}`}
          className="w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          style={{ 
            backgroundColor: color, 
            border: color === value ? '2px solid blue' : '1px solid black'
          }}
          onClick={() => onChange(color)}
          aria-label={`Sélectionner la couleur de texte ${color}`}
        />
      ))}
    </div>
  );
};

export default ColorPicker;