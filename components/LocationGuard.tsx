import React, { useEffect, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

interface LocationGuardProps {
  restaurantId: string;
  children: React.ReactNode;
  onLocationVerified?: (verified: boolean) => void;
}

export const LocationGuard: React.FC<LocationGuardProps> = ({
  restaurantId,
  children,
  onLocationVerified,
}) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const verifyLocation = async () => {
      try {
        // Get user's location
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by your browser');
          setIsAllowed(true); // Allow access if geolocation not supported (backward compatibility)
          setIsVerifying(false);
          onLocationVerified?.(true);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });

            try {
              const response = await fetch('/api/location/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  restaurantId,
                  latitude,
                  longitude,
                }),
              });

              const data = await response.json();

              if (response.ok) {
                setIsAllowed(data.allowed);
                onLocationVerified?.(data.allowed);
                if (!data.allowed) {
                  setError(data.message || 'You are outside the allowed range');
                }
              } else {
                setError(data.error || 'Failed to verify location');
                setIsAllowed(true); // Allow access on error (backward compatibility)
                onLocationVerified?.(true);
              }
            } catch (err) {
              console.error('Location verification error:', err);
              setError('Failed to verify location');
              setIsAllowed(true); // Allow access on error
              onLocationVerified?.(true);
            } finally {
              setIsVerifying(false);
            }
          },
          (err) => {
            console.error('Geolocation error:', err);
            setError('Unable to access your location. Please enable location services.');
            setIsAllowed(true); // Allow access if user denies location (backward compatibility)
            setIsVerifying(false);
            onLocationVerified?.(true);
          }
        );
      } catch (err) {
        console.error('Location guard error:', err);
        setError('An error occurred');
        setIsAllowed(true);
        setIsVerifying(false);
        onLocationVerified?.(true);
      }
    };

    verifyLocation();
  }, [restaurantId, onLocationVerified]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your location...</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">{error || 'This website is only accessible within the restaurant premises.'}</p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <MapPin size={16} />
            <span>Please visit the restaurant to access the menu</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};





