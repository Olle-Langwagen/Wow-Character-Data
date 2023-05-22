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

    function displayTokenPrices() {
        //API endpoints
        const usApiUrl = `https://us.api.blizzard.com/data/wow/token/index?namespace=dynamic-us&locale=en_US&access_token=${accessToken}`;
        const euApiUrl = `https://eu.api.blizzard.com/data/wow/token/index?namespace=dynamic-eu&locale=en_EU&access_token=${accessToken}`;

        
    
        //Token priser för US
        fetch(usApiUrl)
  .then(response => response.json())
  .then(data => {
    const usPrice = Math.floor(data.price / 10000);

    //Displaya US priser
    document.getElementById('us-price').innerText = `${usPrice}g`;



    const timestamp = new Date(data.last_updated_timestamp).toLocaleString();

    const timestampElement = document.getElementById('token-timestamp');
    timestampElement.textContent = timestamp;
  })
  .catch(error => {
    console.log('Error fetching US token price:', error);
  });

//Token priser för Eu
fetch(euApiUrl)
  .then(response => response.json())
  .then(data => {
    const euPrice = Math.floor(data.price / 10000);

    //Displaya EU priser
    document.getElementById('eu-price').innerText = `${euPrice}g`;
  })
  .catch(error => {
    console.log('Error fetching EU token price:', error);
  });
    }
    
    // Call the displayTokenPrices function to fetch and display the token prices
    displayTokenPrices();

  })