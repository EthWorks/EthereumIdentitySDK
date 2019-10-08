import React, {useState} from 'react';
import {Country} from '../../../core/models/Country';
import {countries} from '../../../core/utils/countries';

export interface CountrySelectProps {
  selectedCountry?: string;
  setCountry: (selectedCountry: string) => void;
  setCurrency: (currency: string) => void;
}

export const CountryDropdown = ({selectedCountry, setCountry, setCurrency}: CountrySelectProps) => {
  const [expanded, setExpanded] = useState(false);

  const onDropdownItemClick = (selectedCountry: string, currency: string) => {
    setExpanded(false);
    setCountry(selectedCountry);
  };

  const countrySelectionButton = () => {
    const country = countries.find(({name}) => name === selectedCountry);
    const {name, code} = country || {} as Partial<Country>;
    const flag = code && require(`../../assets/flags/${code.toLowerCase()}.svg`);

    return (
      <button
        onClick={() => setExpanded(!expanded)}
        key={name || 'no-country'}
        className={`country-select-btn country-select-toggle ${expanded ? 'expanded' : ''}`}
      >
        {flag && <img src={flag} alt="" className="country-select-img"/>}
        <p className="country-select-text">{name || 'Select your country'}</p>
      </button>
    );
  };

  const countrySelectionList = () => {
    if (expanded) {
      return (
        <ul className="country-select-list">
          {countries.map(country => (
            <li key={country.name} className="country-select-item">
              <CountryDropdownItem
                {...country}
                onDropdownItemClick={onDropdownItemClick}
              />
            </li>
          ))
          }
        </ul>
      );
    }
  };

  return (
    <div className="country-select">
      {countrySelectionButton()}
      {countrySelectionList()}
    </div>
  );
};

interface CountryDropdownItemProps extends Country {
  onDropdownItemClick: (selectedCountry: string, currency: string) => void;
}

const CountryDropdownItem = ({name, code, currency, onDropdownItemClick}: CountryDropdownItemProps) => (
  <button onClick={() => onDropdownItemClick(name, currency)} className="country-select-btn">
    <img
      src={require(`../../assets/flags/${code.toLowerCase()}.svg`)}
      alt={`${name} flag`}
      className="country-select-img"
    />
    <p className="country-select-text">{name}</p>
  </button>
);
