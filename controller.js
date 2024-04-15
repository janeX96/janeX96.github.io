const addresses = [
  "3 Maja 1D, Gocław, Polska",
  "Jana Wilanda 26, Jatne, Polska",
  "Łukówiec 25a, Karczew, Polska",
  "Armii Krajowej 56, Polska",
  "Wczasowa 25, Otwock, Polska",
  "Borowa 14/18,  Otwock, Polska",
  "Gabriela Narutowicza 154, Otwock, Polska",
  "Gassy 26A, 05-520 Gassy",
  "Marszałka Józefa Piłsudskiego 12,  Józefów, Polska",
  "Wał Miedzeszyński 249 A,  Warszawa, Polska",
];

// Funkcja pobierająca obecną lokalizację
async function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject("Nie można pobrać obecnej lokalizacji.");
        }
      );
    } else {
      reject("Przeglądarka nie obsługuje geolokalizacji.");
    }
  });
}

// Funkcja do przekonwertowania adresu na współrzędne geograficzne za pomocą Nominatim OpenStreetMap
async function geocodeAddress(address) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();

    console.log("Odpowiedź z usługi geokodowania:", data); // Dodana instrukcja do wyświetlenia danych

    if (data.length > 0) {
      const location = data[0];
      // Sprawdzamy, czy istnieją oczekiwane dane w odpowiedzi
      if (location.lat && location.lon) {
        // Tworzymy bardziej skrócony adres
        const shortAddress = `${address}`;
        return {
          address: shortAddress,
          lat: parseFloat(location.lat),
          lng: parseFloat(location.lon),
        };
      } else {
        throw new Error("Nieprawidłowy format danych adresowych.");
      }
    } else {
      throw new Error("Nie znaleziono współrzędnych dla podanego adresu.");
    }
  } catch (error) {
    console.error("Wystąpił błąd podczas geokodowania adresu:", error);
    return null;
  }
}

// Funkcja do pobierania odległości między dwoma współrzędnymi geograficznymi za pomocą OSRM za pomocą metody fetch
async function getDistanceOSRM(origin, destination) {
  try {
    const apiUrl = `http://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.code === "Ok") {
      return data.routes[0].distance; // Zwraca odległość w metrach
    } else {
      throw new Error(`Błąd: ${data.message}`);
    }
  } catch (error) {
    console.error("Wystąpił błąd podczas pobierania odległości:", error);
    return Infinity; // Zwraca nieskończoność w przypadku błędu
  }
}

// Funkcja konwertująca odległość z metrów na kilometry i zaokrąglająca do dwóch miejsc po przecinku
function metersToKilometers(meters) {
  return (meters / 1000).toFixed(2);
}

// Funkcja generująca URL trasy w Google Maps przechodzącej po kolejnych adresach
function generateGoogleMapsUrl(addresses) {
  const waypoints = addresses
    .map((address) => encodeURIComponent(address.address))
    .join("/");
  return `https://www.google.com/maps/dir/My+Location/${waypoints}`;
}

// Funkcja sortująca adresy według odległości
async function sortAddressesByDistance(addresses) {
  let startAddress;
  try {
    startAddress =
      addresses.length > 0
        ? await geocodeAddress(addresses[0])
        : await getCurrentLocation();
  } catch (error) {
    console.error(error);
    startAddress = null;
  }

  const restAddresses = await Promise.all(addresses.map(geocodeAddress));

  const distancesFromStart = await Promise.all(
    restAddresses.map((destination) =>
      getDistanceOSRM(startAddress, destination)
    )
  );

  const sortedAddresses = restAddresses
    .map((destination, index) => ({
      destination,
      distance: distancesFromStart[index],
    }))
    .sort((a, b) => a.distance - b.distance);

  // Usuwamy pierwszy adres z listy, jeśli jest taki sam jak adres startowy
  const filteredAddresses = sortedAddresses.filter(
    (item) => item.destination.address !== startAddress.address
  );

  // Dodajemy adres startowy na początek listy
  const finalAddresses = startAddress
    ? [startAddress, ...filteredAddresses.map((item) => item.destination)]
    : filteredAddresses.map((item) => item.destination);

  return finalAddresses;
}

// Sortowanie adresów według odległości i wyświetlenie posortowanej listy oraz otwarcie trasy w Google Maps
sortAddressesByDistance(addresses)
  .then((sortedAddresses) => {
    console.log("Posortowane adresy według trasy samochodowej:");
    sortedAddresses.forEach((address, index) => {
      console.log(`${index + 1}. ${address.address}`);
    });

    const googleMapsUrl = generateGoogleMapsUrl(sortedAddresses);
    console.log("URL trasy w Google Maps:", googleMapsUrl);

    var link = document.getElementById("link");
    link.setAttribute("href", googleMapsUrl);
    link.textContent = googleMapsUrl;

    // Otwarcie trasy w nowym oknie
    window.open(googleMapsUrl, "_blank");
  })
  .catch((error) => {
    console.error("Wystąpił błąd:", error);
  });
