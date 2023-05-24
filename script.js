const CLIENT_ID = 'fb766b47b70a44018d9ef888f284d5bf';
const CLIENT_SECRET = 'svU5ftd1jUO9eVe226zbZi37DHzvHNYf';



// Fetch the access token
fetch('https://us.battle.net/oauth/token', {
  method: 'POST',
  body: 'grant_type=client_credentials',
  headers: {
    Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})
  .then(response => response.json())
  .then(data => {
    const accessToken = data.access_token;

    console.log(`Access token: ${accessToken}`);

    // Function to fetch the realm list
    const fetchRealmList = async (region) => {
      const response = await fetch(
        `https://${region}.api.blizzard.com/data/wow/realm/index?namespace=dynamic-${region}&locale=en_US&access_token=${accessToken}`
      );
      const data = await response.json();
      return data.realms;
    };

    const getRealmId = async (region, realmName) => {
      const realmListUrl = `https://${region}.api.blizzard.com/data/wow/realm/index?namespace=dynamic-${region}&locale=en_US&access_token=${accessToken}`;
      const response = await fetch(realmListUrl);
      const data = await response.json();
    
      const realms = data.realms;
      const connectedRealms = data.connected_realms;
    
      // Search for standalone realm by name
      const standaloneRealm = realms.find(r => r.name.toLowerCase() === realmName.toLowerCase());
      if (standaloneRealm) {
        return standaloneRealm.id;
      }
    
      // Search for connected realm by name
      for (const connectedRealm of connectedRealms) {
        const connectedRealmUrl = connectedRealm.href;
        const connectedRealmResponse = await fetch(connectedRealmUrl);
        const connectedRealmData = await connectedRealmResponse.json();
    
        const connectedRealmsList = connectedRealmData.connected_realms;
        const connectedRealmMatch = connectedRealmsList.find(r => r.name.toLowerCase() === realmName.toLowerCase());
        if (connectedRealmMatch) {
          return connectedRealmMatch.id;
        }

      }
      return null; // Realm not found
    };

    // Function to convert item name to item ID
    const getItemId = async (itemName) => {
      const response = await fetch(
        `https://us.api.blizzard.com/data/wow/search/item?namespace=static-us&locale=en_US&name.en_US=${encodeURIComponent(
          itemName
        )}&access_token=${accessToken}`
      );
      const data = await response.json();
      const results = data.results;
      if (results.length > 0) {
        return results[0].data.id;
      }
      return null;
    };


    // Function to show the loading animation
    const showLoadingAnimation = () => {
      const loadingContainer = document.getElementById('loading-container');
      loadingContainer.style.display = 'block';
    };
    // Function to remove the loading animation
    const removeLoadingAnimation = () => {
      const loadingContainer = document.getElementById('loading-container');
      loadingContainer.style.display = 'none';
    };


    // Function to sort auctions by price
    const sortAuctions = (auctions, sortBy) => {
      return auctions.sort((a, b) => {
        if (sortBy === 'lowest') {
          return a.buyout - b.buyout; // Sort by lowest price
        } else if (sortBy === 'highest') {
          return b.buyout - a.buyout; // Sort by highest price
        }
        return 0; // Default case (no sorting)
      });
    };

    // Create a paragraph element for logs
    const logParagraph = document.createElement('p');
    const logContainer = document.getElementById('log-container');
    logContainer.appendChild(logParagraph);

    // Function to log messages
    const logMessage = (message) => {
      logParagraph.textContent += `${message}\n`;
    };




    //Main funktion
    // Function to search for auctions based on item name, realm, and region
    const searchAuctions = async () => {
      // Clear the previous auction results
      const container = document.getElementById('auctions-container');
      container.innerHTML = '';
      logParagraph.textContent = '';

      // Show the loading animation
      showLoadingAnimation();

      // Get the item name from the search input
      const itemName = document.getElementById('search-input').value.trim();
      if (itemName === '') {
        logMessage('Please enter an item name');
        removeLoadingAnimation();
        return;
      }

      // Get the realm name and region from the selection inputs
      const realmName = document.getElementById('realm-select').value.trim();
      const region = document.getElementById('region-select').value;

      if (realmName === '') {
        logMessage('Please select a realm');
        removeLoadingAnimation();
        return;
      }

      // Get the sort option from the dropdown menu
      const sortOption = document.getElementById('sort-select').value;

      try {
        // Convert realm name to realm ID
        const realmId = await getRealmId(region, realmName);
        if (realmId === null) {
          logMessage('Realm not found');
          removeLoadingAnimation();
          return;
        }

        // Convert item name to item ID
        const itemId = await getItemId(itemName);
        if (itemId === null) {
          logMessage('Item not found');
          removeLoadingAnimation();
          return;
        }

       


        // Make a request to the Blizzard API endpoint with the access token, realm ID, and item ID
    const auctionsUrl = `https://${region}.api.blizzard.com/data/wow/connected-realm/${realmId}/auctions?namespace=dynamic-${region}&locale=en_US&access_token=${accessToken}`;
    const response = await fetch(auctionsUrl);

    if (response.status === 404) {
      logMessage('No auctions found for the specified realm');
      removeLoadingAnimation();
      return;
    }
        const data = await response.json();
        const auctions = data.auctions;
            // Filter auctions based on the searched item ID
    const filteredAuctions = auctions.filter(auction => auction.item.id === itemId);

    // Sort the filtered auctions based on the selected sort option
    const sortedAuctions = sortAuctions(filteredAuctions, sortOption);

    // Retrieve the last updated timestamp from the response headers
    const lastUpdatedHeader = response.headers.get('last-modified');
    console.log(lastUpdatedHeader);
    const lastUpdatedTimestamp = new Date(lastUpdatedHeader).toLocaleString();

    // Sort the filtered auctions by buyout price

    //filteredAuctions.sort((a, b) => a.buyout - b.buyout);

    // Display the filtered auctions in the console
    sortedAuctions.forEach(auction => {
      const auctionDiv = document.createElement('div');
      auctionDiv.className = 'auction';

      const priceDiv = document.createElement('div');
      priceDiv.className = 'price';
      const priceText = document.createTextNode((auction.buyout / auction.quantity / 10000).toFixed(2));
      const goldText = document.createElement('span');
      goldText.className = 'goldText';
      goldText.innerHTML = 'g';
      priceDiv.appendChild(priceText);
      priceDiv.appendChild(goldText);
      auctionDiv.appendChild(priceDiv);

      const itemDiv = document.createElement('div');
      itemDiv.className = 'item';
      const imgDiv = document.createElement('div');
      imgDiv.className = 'img';
      const img = document.createElement('img');

      const itemMediaUrl = `https://us.api.blizzard.com/data/wow/media/item/${auction.item.id}?namespace=static-us&locale=en_US&access_token=${accessToken}`;
      fetch(itemMediaUrl)
        .then(response => response.json())
        .then(mediaData => {
          const asset = mediaData.assets.find(a => a.key === 'icon');
          if (asset) {
            img.src = asset.value;
          }
        })
        .catch(error => {
          console.error(error);
          img.src = 'https://dummyimage.com/56x56/000/fff.png&text=No+Image';
        });
      imgDiv.appendChild(img);
      itemDiv.appendChild(imgDiv);

      const nameDiv = document.createElement('div');
      nameDiv.className = 'name';
      const itemNameLink = document.createElement('a');
      itemNameLink.href = `https://www.wowhead.com/item=${auction.item.id}`;
      itemNameLink.className = 'wowhead';
      itemNameLink.setAttribute('data-wowhead', `item=${auction.item.id}`);

      // Fetch item name using the item ID
      fetch(
        `https://us.api.blizzard.com/data/wow/item/${auction.item.id}?namespace=static-us&locale=en_US&access_token=${accessToken}`
      )
        .then(response => response.json())
        .then(itemData => {
          itemNameLink.textContent = itemData.name || 'Unknown Item';
        })
        .catch(error => {
          console.error(error);
          itemNameLink.textContent = 'Unknown Item';
        });
      nameDiv.appendChild(itemNameLink);
      itemDiv.appendChild(nameDiv);
      auctionDiv.appendChild(itemDiv);

      const quantityDiv = document.createElement('div');
      quantityDiv.className = 'quantity';
      const quantityText = document.createTextNode(auction.quantity || 1);
      quantityDiv.appendChild(quantityText);
      auctionDiv.appendChild(quantityDiv);

      const container = document.getElementById('auctions-container');
      container.appendChild(auctionDiv);

      
    });

    // Set the last updated timestamp
    const lastUpdatedElement = document.getElementById('last-updated-timestamp');
    const lastUpdatedParapgraph = document.getElementById('last-updated');
    lastUpdatedParapgraph.style.display = 'block';
    lastUpdatedElement.textContent = lastUpdatedTimestamp;


    removeLoadingAnimation();

        // Wowhead tooltip
        window.onload = function() {
          WH.Tooltip.init();
        }
      } catch (error) {
        logMessage(`Error: ${error}`);
        removeLoadingAnimation();
      }
};

// Filter knapp
document.getElementById('search-button').addEventListener('click', searchAuctions);

// Function to populate the realm select input with realm names
const populateRealmSelect = async (region) => {
  const realms = await fetchRealmList(region);
  const realmSelect = document.getElementById('realm-select');

  // Sort the realms array alphabetically by name
  realms.sort((a, b) => a.name.localeCompare(b.name));

  realms.forEach(realm => {
    const option = document.createElement('option');
    option.value = realm.name;
    option.textContent = realm.name;
    realmSelect.appendChild(option);
  });
};

// Event listener for the region select input
document.getElementById('region-select').addEventListener('change', (event) => {
  const region = event.target.value;
  const realmSelect = document.getElementById('realm-select');
  realmSelect.innerHTML = '';

  if (region !== '') {
    populateRealmSelect(region);
  }
});
})
.catch(error => {
console.error('Error:', error);
});
