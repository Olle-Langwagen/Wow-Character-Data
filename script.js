const CLIENT_ID = window.CLIENT_ID;
const CLIENT_SECRET = window.CLIENT_SECRET;
const REALM = "1175"; //1175 = Dalaran but will add so the form can be used to select the realm

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
    const access_token = data.access_token;//data.access_token;
    const url = `https://us.api.blizzard.com/data/wow/connected-realm/${REALM}/auctions?namespace=dynamic-us&locale=en_US&access_token=${access_token}`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then(data => {
        console.log(data); // log the response data to the console for debugging
        const auctions = data.auctions.slice(0, 100); // get the first 30 auctions

        if (auctions.length === 0) { // if there are no auctions, display an error message
          const errorMessage = document.createElement('p');
          errorMessage.textContent = 'No auctions found.';
          document.body.appendChild(errorMessage);
          return;
        }

        const itemIds = auctions.map(auction => auction.item.id).filter((value, index, self) => self.indexOf(value) === index);

        const itemPromises = itemIds.map(itemId => fetch(`https://us.api.blizzard.com/data/wow/item/${itemId}?namespace=static-us&locale=en_US&access_token=${access_token}`).then(response => response.json()));

        Promise.all(itemPromises).then(itemData => {
          const itemsById = {};
          itemData.forEach(item => {
            itemsById[item.id] = item.name;
          });

          //Search bar
          const searchInput = document.createElement('input');
          searchInput.type = 'text';
          searchInput.placeholder = 'Search auctions...';
          searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value.toLowerCase();
            const auctions = document.querySelectorAll('.auction');
            auctions.forEach((auction) => {
              const name = auction.querySelector('.name').textContent.toLowerCase();
              if (name.includes(searchTerm)) {
                auction.style.display = '';
              } else {
                auction.style.display = 'none';
              }
            });
          });
          const header = document.querySelector('.auctions-header');
          header.appendChild(searchInput);

          

          auctions.forEach(auction => { // loop through each auction
            const auctionDiv = document.createElement('div');
            auctionDiv.className = 'auction';
          
            const priceDiv = document.createElement('div');
            priceDiv.className = 'price';
            const priceImg = document.createElement('img');
            priceImg.src = 'https://wow.zamimg.com/images/icons/money-gold.gif';
            priceImg.alt = 'gold coin icon';
            const priceText = document.createTextNode((auction.buyout / auction.quantity / 10000).toFixed(2));
            priceDiv.appendChild(priceImg);
            priceDiv.appendChild(priceText);
            auctionDiv.appendChild(priceDiv);
          
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item';
            const imgDiv = document.createElement('div');
            imgDiv.className = 'img';
            const img = document.createElement('img');
            img.alt = itemsById[auction.item.id];
            const itemMediaUrl = `https://us.api.blizzard.com/data/wow/media/item/${auction.item.id}?namespace=static-us&locale=en_US&access_token=${access_token}`;
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
            itemNameLink.textContent = itemsById[auction.item.id] || 'Unknown Item';
            nameDiv.appendChild(itemNameLink);
            itemDiv.appendChild(nameDiv);
            auctionDiv.appendChild(itemDiv);
          
            const quantityDiv = document.createElement('div');
            quantityDiv.className = 'quantity';
            const quantityText = document.createTextNode(auction.quantity || 1);
            quantityDiv.appendChild(quantityText);
            auctionDiv.appendChild(quantityDiv);
          
            document.body.appendChild(auctionDiv);
          });

          window.onload = function() {
            WH.Tooltip.init();
          }
        }).catch(error => {
          console.error(error);
          const errorMessage = document.createElement('p');
          errorMessage.textContent = 'An error occurred while retrieving auction data. Please try again later.';
          document.body.appendChild(errorMessage);
        });
      })
      .catch(error => {
        console.error(error);
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'An error occurred while retrieving auction data. Please try again later.';
        document.body.appendChild(errorMessage);
      });
    })
    .catch(error => console.error(error));
