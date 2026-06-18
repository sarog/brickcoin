const raw_data = [{"country_code": "CA", "country_label": "Canada", "languages": [{"language_code": "en", "language_label": "English"}, {"language_code": "fr", "language_label": "Fran\u00e7ais"}]}, {"country_code": "US", "country_label": "United States", "languages": [{"language_code": "en", "language_label": "English"}, {"language_code": "es", "language_label": "Espa\u00f1ol"}]}, {"country_code": "MX", "country_label": "Mexico", "languages": [{"language_code": "en", "language_label": "English"}, {"language_code": "es", "language_label": "Espa\u00f1ol"}]}, {"country_code": "BR", "country_label": "Brasil", "languages": [{"language_code": "pt", "language_label": "Portugu\u00eas"}]}, {"country_code": "AT", "country_label": "\u00d6sterreich", "languages": [{"language_code": "de", "language_label": "Deutsch"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "BE", "country_label": "Belgique", "languages": [{"language_code": "fr", "language_label": "Fran\u00e7ais"}, {"language_code": "nl", "language_label": "Nederlands"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "CH", "country_label": "Schweiz", "languages": [{"language_code": "de", "language_label": "Deutsch"}, {"language_code": "fr", "language_label": "Fran\u00e7ais"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "CZ", "country_label": "\u010cesk\u00e1 republika", "languages": [{"language_code": "cs", "language_label": "\u010ce\u0161tina"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "DE", "country_label": "Deutschland", "languages": [{"language_code": "de", "language_label": "Deutsch"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "DK", "country_label": "Danmark", "languages": [{"language_code": "da", "language_label": "Dansk"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "EE", "country_label": "Eesti", "languages": [{"language_code": "et", "language_label": "Eesti"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "ES", "country_label": "Espa\u00f1a", "languages": [{"language_code": "es", "language_label": "Espa\u00f1ol"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "FI", "country_label": "Finland", "languages": [{"language_code": "en", "language_label": "English"}, {"language_code": "fi", "language_label": "Suomi"}]}, {"country_code": "FR", "country_label": "France", "languages": [{"language_code": "fr", "language_label": "Fran\u00e7ais"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "GB", "country_label": "United Kingdom", "languages": [{"language_code": "en", "language_label": "English"}]}, {"country_code": "GR", "country_label": "Greece", "languages": [{"language_code": "en", "language_label": "English"}]}, {"country_code": "HU", "country_label": "Hungary", "languages": [{"language_code": "en", "language_label": "English"}, {"language_code": "hu", "language_label": "Hungarian"}]}, {"country_code": "IE", "country_label": "Ireland", "languages": [{"language_code": "en", "language_label": "English"}]}, {"country_code": "IT", "country_label": "Italia", "languages": [{"language_code": "it", "language_label": "Italiano"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "LT", "country_label": "Lietuva", "languages": [{"language_code": "lt", "language_label": "Lietuvi\u0161kai"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "LU", "country_label": "Luxembourg", "languages": [{"language_code": "fr", "language_label": "Fran\u00e7ais"}, {"language_code": "de", "language_label": "Deutsch"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "LV", "country_label": "Latvija", "languages": [{"language_code": "lv", "language_label": "Latvie\u0161u"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "NL", "country_label": "Nederland", "languages": [{"language_code": "nl", "language_label": "Nederlands"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "NO", "country_label": "Norge", "languages": [{"language_code": "nb", "language_label": "Norsk Bokm\u00e5l"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "PL", "country_label": "Polska", "languages": [{"language_code": "pl", "language_label": "Polski"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "PT", "country_label": "Portugal", "languages": [{"language_code": "pt", "language_label": "Portugu\u00eas"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "RO", "country_label": "Romania", "languages": [{"language_code": "ro", "language_label": "Romanian"}]}, {"country_code": "SE", "country_label": "Sweden", "languages": [{"language_code": "en", "language_label": "English"}, {"language_code": "sv", "language_label": "Svenska"}]}, {"country_code": "SI", "country_label": "Slovenia", "languages": [{"language_code": "en", "language_label": "English"}]}, {"country_code": "SK", "country_label": "Slovensko", "languages": [{"language_code": "sk", "language_label": "Sloven\u010dina"}, {"language_code": "en", "language_label": "English"}]}, {"country_code": "UA", "country_label": "Ukraine", "languages": [{"language_code": "ua", "language_label": "Ukrainian"}]}, {"country_code": "AU", "country_label": "Australia", "languages": [{"language_code": "en", "language_label": "English"}]}, {"country_code": "NZ", "country_label": "New Zealand", "languages": [{"language_code": "en", "language_label": "English"}]}];
const data = [...raw_data].sort((a, b) => a.country_label.localeCompare(b.country_label));

// JSON data

const language_to_country_code = {
  'en': 'GB',
  'sv': 'SE',
  'nb': 'NO',
  'da': 'DK',
  'cs': 'CZ',
  'et': 'EE',
};

// Helper function to get language flag/icon (placeholder for now)
const getFlagEmoji = (countryCode, is_language_code) => {
  if (is_language_code) {
    countryCode = language_to_country_code[countryCode] || countryCode;
  }
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

const countrySelect = document.getElementById("country");
const languageSelect = document.getElementById("language");

window.onload = function () {
  const countrySelect = document.getElementById("country");
  const languageSelect = document.getElementById("language");

  // Populate the country dropdown
  data.forEach(country => {
    const option = document.createElement("option");
    option.value = country.country_code;
    option.textContent = country.country_label;


    const optionWrapper = document.createElement("div");
    const countryFlag = getFlagEmoji(country.country_code, false);
    optionWrapper.appendChild(document.createTextNode(`${countryFlag} ${country.country_label}`));


    option.innerHTML = optionWrapper.innerHTML;
    countrySelect.appendChild(option);
  });

  // Load saved values on page load
  loadFromBrowserStorage(countrySelect, languageSelect);

  // Update the language dropdown when a country is selected
  countrySelect.addEventListener("change", function () {
    const selectedCountry = data.find(country => country.country_code === this.value);
    if (selectedCountry) {
      populateLanguages(languageSelect, selectedCountry.languages);
    }

    // Save the selected country and reset language selection
    saveToBrowserStorage(this.value, languageSelect.value || "");
  });

  // Save the selected language when it changes
  languageSelect.addEventListener("change", function () {
    saveToBrowserStorage(countrySelect.value, this.value);
  });
};

// Save data to Browser storage
function saveToBrowserStorage(countryCode, languageCode) {
  chrome.storage.sync.set({ country_code: countryCode, language_code: languageCode }, () => {
    console.log("Settings saved:", { country_code: countryCode, language_code: languageCode });
  });
}

// Load saved data from Browser storage
function loadFromBrowserStorage(countrySelect, languageSelect) {
  chrome.storage.sync.get(["country_code", "language_code"], (result) => {
    if (result.country_code) {
      countrySelect.value = result.country_code;

      // Update language dropdown based on the saved country
      const selectedCountry = data.find(country => country.country_code === result.country_code);
      if (selectedCountry) {
        populateLanguages(languageSelect, selectedCountry.languages);

        // Set the saved language if it exists
        if (result.language_code) {
          languageSelect.value = result.language_code;
        }
      }
    }
  });
}

// Populate the language dropdown
function populateLanguages(languageSelect, languages) {
  // Clear the language dropdown
  languageSelect.innerHTML = "";

  languages.forEach(language => {
    const option = document.createElement("option");
    option.value = language.language_code;
    const languageFlag = getFlagEmoji(language.language_code, true);
    option.textContent = `${languageFlag} ${language.language_label}`;
    languageSelect.appendChild(option);
  });
}
