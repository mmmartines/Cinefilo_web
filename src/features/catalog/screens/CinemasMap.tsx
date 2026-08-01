import { useState, useEffect } from 'react';
import { Search, MapPin, List, Map as MapIcon, Loader2, Navigation, AlertCircle } from 'lucide-react';

export function CinemasMap() {
  const [cinemas, setCinemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [mapRegion, setMapRegion] = useState({
    latitude: -14.235,
    longitude: -51.925
  });

  const GOOGLE_API_KEY = import.meta.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    handleUseGPS();
  }, []);

  const handleGooglePlacesResponse = async (response: Response) => {
    const originData = await response.json();
    let data = originData;
    // se usarmos allorigins, o json vem em contents
    if (originData.contents) {
      data = JSON.parse(originData.contents);
    }
    
    if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'REQUEST_DENIED') {
      setMapUnavailable(true);
      throw new Error('QUOTA_EXCEEDED');
    }
    setMapUnavailable(false);
    return data.results || [];
  };

  const fetchCinemasByLocation = async (lat: number, lon: number, cityConstraint?: string) => {
    if (!GOOGLE_API_KEY) {
      setMapUnavailable(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setLocationStatus(cityConstraint ? `Filtrando cinemas em ${cityConstraint}...` : 'Buscando cinemas num raio de 15km...');
    setMapRegion({ latitude: lat, longitude: lon });
    
    try {
      const targetUrl = encodeURIComponent(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=15000&type=movie_theater&key=${GOOGLE_API_KEY}`);
      const url = `https://corsproxy.io/?${targetUrl}`;
      
      const response = await fetch(url);
      let results = await handleGooglePlacesResponse(response);
      
      if (cityConstraint) {
        const lowerCity = cityConstraint.toLowerCase();
        results = results.filter((p: any) => 
          p.vicinity?.toLowerCase().includes(lowerCity) || 
          p.plus_code?.compound_code?.toLowerCase().includes(lowerCity)
        );
      }
      
      const mappedCinemas = results.map((place: any) => ({
        id: place.place_id,
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
        tags: {
          name: place.name,
          'addr:street': place.vicinity
        }
      }));
      setCinemas(mappedCinemas);
      if (mappedCinemas.length === 0 && cityConstraint) {
        setErrorMsg(`Nenhum cinema encontrado restrito à cidade de ${cityConstraint}.`);
      }
    } catch (e: any) {
      if (e.message !== 'QUOTA_EXCEEDED') {
        setErrorMsg('Não foi possível buscar os cinemas na sua região. Verifique se o bloqueador de anúncios bloqueou a requisição ou o proxy CORS falhou.');
      }
    } finally {
      setLoading(false);
      setLocationStatus('');
    }
  };

  const fetchCinemasByCity = async (city: string) => {
    if (!city.trim()) return;
    if (!GOOGLE_API_KEY) {
      setMapUnavailable(true);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setLocationStatus(`Buscando cinemas em ${city}...`);
    try {
      const targetUrl = encodeURIComponent(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=cinemas+in+${city}&type=movie_theater&key=${GOOGLE_API_KEY}`);
      const url = `https://corsproxy.io/?${targetUrl}`;
      
      const response = await fetch(url);
      let results = await handleGooglePlacesResponse(response);
      
      const lowerCity = city.toLowerCase();
      results = results.filter((p: any) => p.formatted_address?.toLowerCase().includes(lowerCity));
      
      const mappedCinemas = results.map((place: any) => ({
        id: place.place_id,
        lat: place.geometry.location.lat,
        lon: place.geometry.location.lng,
        tags: {
          name: place.name,
          'addr:street': place.formatted_address
        }
      }));
      setCinemas(mappedCinemas);
      
      if (mappedCinemas.length > 0) {
        setMapRegion({
          latitude: mappedCinemas[0].lat,
          longitude: mappedCinemas[0].lon
        });
      } else {
        setErrorMsg(`Nenhum cinema encontrado em ${city}.`);
      }
    } catch (e: any) {
      if (e.message !== 'QUOTA_EXCEEDED') {
        setErrorMsg('Não foi possível buscar cinemas nessa cidade.');
      }
    } finally {
      setLoading(false);
      setLocationStatus('');
    }
  };

  const handleUseGPS = () => {
    setLoading(true);
    setErrorMsg('');
    setLocationStatus('Obtendo localização do navegador...');
    
    if (!navigator.geolocation) {
      setErrorMsg('Geolocalização não é suportada neste navegador.');
      setLoading(false);
      setLocationStatus('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchCinemasByLocation(latitude, longitude);
      },
      (error) => {
        setErrorMsg('Não foi possível obter a sua localização. Verifique se você permitiu o acesso ao GPS.');
        setLoading(false);
        setLocationStatus('');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const openMaps = (lat: number, lon: number, name: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  };

  const leafletHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background: #18181b; }
        html, body, #map { height: 100%; width: 100%; }
        .leaflet-container { background: #18181b; font-family: sans-serif; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${mapRegion.latitude}, ${mapRegion.longitude}], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        var cinemas = ${JSON.stringify(cinemas)};
        
        cinemas.forEach(function(c) {
          if (c.lat && c.lon) {
            var marker = L.marker([c.lat, c.lon]).addTo(map);
            marker.bindPopup("<b>" + (c.tags?.name || "Cinema") + "</b><br>" + (c.tags?.['addr:street'] || "Ver Lista"));
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: '600px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--color-bg-element)', borderRadius: '12px', padding: '0 16px', height: '48px', border: '1px solid var(--color-border)' }}>
          <input
            type="text"
            placeholder="Buscar por nome da Cidade..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCinemasByCity(searchCity)}
            style={{ flex: 1, background: 'transparent', border: 'none', color: '#FAFAFA', fontSize: '16px', outline: 'none' }}
          />
        </div>
        <button 
          onClick={() => fetchCinemasByCity(searchCity)}
          disabled={loading}
          style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-bg-element)', border: '1px solid var(--color-border)', color: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Search size={20} />
        </button>
        <button 
          onClick={handleUseGPS}
          disabled={loading}
          style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary)', border: 'none', color: '#FAFAFA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <MapPin size={20} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          onClick={() => setViewMode('map')} 
          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: viewMode === 'map' ? 'var(--color-primary)' : 'var(--color-bg-element)', border: '1px solid ' + (viewMode === 'map' ? 'var(--color-primary)' : 'var(--color-border)'), color: viewMode === 'map' ? '#fff' : 'var(--color-text-muted)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <MapIcon size={18} /> Mapa
        </button>
        <button 
          onClick={() => setViewMode('list')} 
          style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-bg-element)', border: '1px solid ' + (viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-border)'), color: viewMode === 'list' ? '#fff' : 'var(--color-text-muted)', fontWeight: 'bold', cursor: 'pointer' }}
        >
          <List size={18} /> Lista
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid var(--color-primary)', borderRadius: '12px', color: '#ffb4b4', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}

      <div style={{ flex: 1, minHeight: '500px', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-element)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
            <Loader2 size={40} color="#E50914" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--color-text-muted)' }}>{locationStatus}</span>
          </div>
        ) : viewMode === 'map' ? (
          mapUnavailable ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px' }}>
              <MapIcon size={48} color="#E50914" style={{ marginBottom: '16px' }} />
              <h3 style={{ color: '#FAFAFA', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Mapa Indisponível no Momento</h3>
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>A cota de uso da API do Google foi atingida ou a chave não está configurada corretamente.</p>
            </div>
          ) : (
            <iframe 
              srcDoc={leafletHTML}
              style={{ width: '100%', height: '100%', border: 'none', flex: 1 }}
              title="Cinemas Map"
            />
          )
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cinemas.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '40px' }}>
                Busque por GPS ou digite uma cidade para encontrar cinemas próximos.
              </p>
            ) : (
              cinemas.map((cinema) => (
                <div key={cinema.id} style={{ background: 'var(--color-bg-base)', borderRadius: '12px', padding: '16px', borderLeft: '4px solid var(--color-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ color: '#FAFAFA', fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{cinema.tags?.name || 'Cinema Desconhecido'}</h3>
                    {cinema.tags?.['addr:street'] && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>{cinema.tags['addr:street']}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => openMaps(cinema.lat, cinema.lon, cinema.tags?.name)}
                    style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <Navigation size={16} /> Como Chegar
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
