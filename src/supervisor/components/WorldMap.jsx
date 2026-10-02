import { useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json';
import { Minus, Plus } from 'lucide-react';

const geography = feature(atlas, atlas.objects.countries);
const projection = geoNaturalEarth1().fitExtent([[18, 12], [862, 360]], { type: 'Sphere' });
const path = geoPath(projection);
const atlasIds = { MX:'484', BR:'076', SY:'760', PS:'275', UA:'804', CD:'180' };

export default function WorldMap({ countries, offices, onCountrySelect, onOfficeSelect }) {
  const [zoom, setZoom] = useState(1);
  const byShape = new Map(countries.map(country => [atlasIds[country.iso_alpha2], country]));
  const cityPoints = offices.filter(office => Number.isFinite(office.location.latitude) && Number.isFinite(office.location.longitude));
  const activate = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); }
  };
  return <div className="world-map">
    <div className="map-heading"><span>Geographic presence</span><span className="micro">Select a country or office</span></div>
    <svg viewBox="0 0 880 385" role="group" aria-label="Interactive map of countries selected for the prototype and three Mexican cities with UNHCR offices">
      <defs><pattern id="map-grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#a9b9c0" opacity=".32"/></pattern></defs>
      <rect width="880" height="385" fill="url(#map-grid)"/>
      <g transform={`translate(440 192) scale(${zoom}) translate(-440 -192)`}>
        {geography.features.filter(f => f.id !== '010').map((shape,index) => {
          const country = byShape.get(shape.id);
          const hasOffices = country && offices.some(office => office.country_id === country.id);
          return <path key={`${shape.id ?? 'area'}-${index}`} d={path(shape)} className={country ? `map-country ${hasOffices ? 'populated' : country.iso_alpha2 === 'PS' ? 'palestine' : 'selected'}` : ''}
            fill={hasOffices ? '#0072BC' : country?.iso_alpha2 === 'PS' ? '#D4B55C' : country ? '#7DB2DC' : '#DEE6ED'} stroke="#fff" strokeWidth=".7"
            {...(country ? {role:'button',tabIndex:0,'aria-label':`${country.display_name}: ${hasOffices ? 'offices in sample' : 'no offices in sample'}`,onClick:() => onCountrySelect(country.id),onKeyDown:event => activate(event,()=>onCountrySelect(country.id))} : {})}>
            {country && <title>{country.display_name}{hasOffices ? ' · offices in sample' : ' · no offices in sample'}</title>}
          </path>;
        })}
        {cityPoints.map(office => {
          const [x,y] = projection([office.location.longitude,office.location.latitude]);
          return <g key={office.id} role="button" tabIndex={0} aria-label={`Open ${office.display_name}; marker at city centre`} onClick={() => onOfficeSelect(office.id)} onKeyDown={event => activate(event,()=>onOfficeSelect(office.id))} className="map-city">
            <title>{office.display_name} · approximate city-centre marker</title>
            <circle cx={x} cy={y} r={11/zoom} fill="#FFD100" fillOpacity=".35"/><circle cx={x} cy={y} r={5/zoom} fill="#FFD100" stroke="#18375F" strokeWidth={1.8/zoom}/>
          </g>;
        })}
      </g>
    </svg>
    <div className="map-controls"><button aria-label="Zoom in" onClick={() => setZoom(z => Math.min(2,z+.25))} disabled={zoom >= 2}><Plus size={16}/></button><button aria-label="Zoom out" onClick={() => setZoom(z => Math.max(1,z-.25))} disabled={zoom <= 1}><Minus size={16}/></button></div>
    <div className="map-legend"><span><i className="legend-office"/>Country with demo offices</span><span><i className="legend-selected"/>Selected country without demo offices</span><span><i className="legend-palestine"/>Palestine: UNRWA mandate</span></div>
    <p className="map-note">Dots mark approximate city centres, not office addresses. UNHCR lists the Mexican offices.</p>
  </div>;
}
