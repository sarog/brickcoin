const style = document.createElement('style');
style.innerHTML = `
.loading {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 10px solid #ddd;
  border-top-color: orange;
  animation: loading 1s linear infinite;
}
table {
    width: 100%;
    border-collapse: collapse;
  }
  th, td {
    padding: 10px; /* Increased padding for more space between rows */
    text-align: left;
    border: 1px solid #ddd;
    line-height: 1.6; /* Increased line height for better spacing */
  }
  th:nth-child(1), td:nth-child(1) { width: 20%; } /* Lego Type */
  th:nth-child(2), td:nth-child(2) { width: 15%; } /* Save Up To */
  th:nth-child(3), td:nth-child(3) { width: 15%; } /* Add to PAB */
  th:nth-child(4), td:nth-child(4) { width: 15%; } /* Remove from Cart */
  th:nth-child(5), td:nth-child(5) { width: 15%; } /* Add to PAB */
  th:nth-child(6), td:nth-child(6) { width: 20%; } /* Remove from Cart */
  .highlight_green {
    font-weight: bold;
    color: green;
  }
  .highlight_red {
    font-weight: bold;
    color: red;
  }
  .redbutton {
    color: red !important;
  }
`;
document.head.appendChild(style);

function addLegoPabShortcut() {
  element = document.querySelector('.global-carts__options')
  new_shortcut = document.createElement('button')
  new_shortcut.classList.add('bl-btn')
  new_shortcut.id = 'pab-shortcut'
  new_shortcut.textContent = 'Lego PAB'
  new_shortcut.addEventListener('click', function () {
    chrome.runtime.sendMessage({
      action: "pab_shortcut",
    });
  });
  element.appendChild(new_shortcut)
}

function addLoader() {
  elements = document.querySelectorAll('.flex-table__row--wrap')
  for (let element of elements) {
    loader = document.createElement('div');
    loader.classList.add('loading');
    loader.id = 'loader_id'
    loader.innerHTML = '<span">Please wait, processing cart...</span>';
    element.appendChild(loader);
  }
}

function updateData(sellerData) {
  const elements = document.querySelectorAll('.flex-table__row--wrap');

  for (let element of elements) {
    const totalLotsMatch = element.querySelector('div:nth-child(3)').textContent.includes(sellerData.totalLots);
    const totalPriceMatch = element.querySelector('div:nth-child(6)').textContent.includes(sellerData.totalPriceRaw);

    if (totalLotsMatch && totalPriceMatch) {
      console.log(element.querySelector('div:nth-child(2)').textContent);
      element.removeChild(element.querySelector('#loader_id'));

      const table = document.createElement('table');
      table.innerHTML = `
                <tr>
                    <th>Lego Type</th>
                    <th>Total Bricklink</th>
                    <th>Total Lego</th>
                    <th>Savings</th>
                    <th></th>
                    <th></th>
                </tr>`;

      // Helper function to create each row
      const createRow = (type, bricklinkPrice, legoPrice, save, items, legoCurrency, cartCurrency, cartType, suffix) => {
        const row = document.createElement('tr');

        const createCell = (content, className) => {
          const cell = document.createElement('td');
          if (className) cell.className = className;
          cell.textContent = content;
          return cell;
        };

        // Create each cell
        const typeCell = createCell(type);

        const bricklinkCell = document.createElement('td');
        const bricklinkSpan = document.createElement('span');
        bricklinkSpan.className = bricklinkPrice > legoPrice ? 'highlight_red' : 'highlight_green';
        bricklinkSpan.textContent = `${cartCurrency} ${bricklinkPrice.toFixed(2)}`;
        bricklinkCell.appendChild(bricklinkSpan);

        const legoCell = document.createElement('td');
        const legoSpan = document.createElement('span');
        legoSpan.className = bricklinkPrice > legoPrice ? 'highlight_green' : 'highlight_red';
        legoSpan.textContent = `${legoCurrency} ${legoPrice.toFixed(2)}`;
        legoCell.appendChild(legoSpan);

        const saveCell = document.createElement('td');
        const saveSpan = document.createElement('span');
        saveSpan.className = bricklinkPrice > legoPrice ? 'highlight_green' : 'highlight_red';
        saveSpan.textContent = `${legoCurrency.toUpperCase() == cartCurrency.toUpperCase() ? legoCurrency : 'ERROR'} ${save.toFixed(2)}`;
        saveCell.appendChild(saveSpan);

        // Add button cells with conditions
        const addButtonCell = document.createElement('td');
        const addButton = document.createElement('button');
        addButton.className = `bl-btn bl-btn--tight ${bricklinkPrice > legoPrice ? 'primaryGreen--inverted' : 'redbutton'}`;
        addButton.id = `add-${suffix}`;
        addButton.textContent = 'Add to PAB';
        if (save <= 0) addButton.style.display = 'none';
        addButton.addEventListener('click', (event) => {
          chrome.runtime.sendMessage({
            action: "add_2_pab",
            items: items,
            autho: null,
            cartType: cartType
          });
          event.target.style.display = "none";
        });
        addButtonCell.appendChild(addButton);

        const removeButtonCell = document.createElement('td');
        const removeButton = document.createElement('button');
        removeButton.className = 'bl-btn bl-btn--tight redbutton';
        removeButton.id = `remove-${suffix}`;
        removeButton.textContent = 'Remove from Cart';
        if (save <= 0) removeButton.style.display = 'none';
        removeButton.addEventListener('click', (event) => {
          chrome.runtime.sendMessage({
            action: "remove_from_cart",
            items: items,
            sid: sellerData.sid
          });
          event.target.style.display = "none";
        });
        removeButtonCell.appendChild(removeButton);

        // Append cells to row
        row.append(typeCell, bricklinkCell, legoCell, saveCell, addButtonCell, removeButtonCell);
        return row;
      };

      // Populate rows based on sellerData
      if (sellerData.comparison.bap.total_bricklink > 0) {
        table.appendChild(createRow(
          "Standard",
          sellerData.comparison.bap.total_bricklink,
          sellerData.comparison.bap.total_lego,
          sellerData.comparison.bap.totalSave,
          sellerData.comparison.bap.listOfItems,
          sellerData.comparison.legoCurrency,
          sellerData.comparison.cartCurrency,
          'bap',
          'standard'
        ));
      }
      if (sellerData.comparison.pab.total_bricklink > 0) {
        table.appendChild(createRow(
          "Bestseller",
          sellerData.comparison.pab.total_bricklink,
          sellerData.comparison.pab.total_lego,
          sellerData.comparison.pab.totalSave,
          sellerData.comparison.pab.listOfItems,
          sellerData.comparison.legoCurrency,
          sellerData.comparison.cartCurrency,
          'pab',
          'bestseller'
        ));
      }
      // Bricklink vs. PAB Standard
      if (sellerData.comparison.bap_bricklink.total_bricklink > 0) {
        table.appendChild(createRow(
          "Bricklink-Standard",
          sellerData.comparison.bap_bricklink.total_bricklink,
          sellerData.comparison.bap_bricklink.total_lego,
          sellerData.comparison.bap_bricklink.totalSave,
          sellerData.comparison.bap_bricklink.listOfItems,
          sellerData.comparison.legoCurrency,
          sellerData.comparison.cartCurrency,
          'bap',
          'bricklink-standard'
        ));
      }
      // Bricklink vs. PAB Bestseller
      if (sellerData.comparison.pab_bricklink.total_bricklink > 0) {
        table.appendChild(createRow(
          "Bricklink-Bestseller",
          sellerData.comparison.pab_bricklink.total_bricklink,
          sellerData.comparison.pab_bricklink.total_lego,
          sellerData.comparison.pab_bricklink.totalSave,
          sellerData.comparison.pab_bricklink.listOfItems,
          sellerData.comparison.legoCurrency,
          sellerData.comparison.cartCurrency,
          'pab',
          'bricklink-bestseller'
        ));
      }
      if (sellerData.comparison.bricklink.total_bricklink > 0) {
        const row = document.createElement('tr');
        const bricklinkCell = document.createElement('td');
        bricklinkCell.textContent = 'Bricklink';
        row.appendChild(bricklinkCell);
        const totalBricklinkCell = document.createElement('td');
        const totalBricklinkSpan = document.createElement('span');
        totalBricklinkSpan.textContent = `${sellerData.comparison.cartCurrency} ${sellerData.comparison.bricklink.total_bricklink.toFixed(2)}`;
        totalBricklinkCell.appendChild(totalBricklinkSpan);
        row.appendChild(totalBricklinkCell);

        for (let i = 0; i < 4; i++) {
          const emptyCell = document.createElement('td');
          const emptySpan = document.createElement('span');
          emptyCell.appendChild(emptySpan);
          row.appendChild(emptyCell);
        }

        // Append the constructed row to the table
        table.appendChild(row);
      }

      element.appendChild(table);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('CONTENT LOADER', message)
  if (message.action == 'readCookieGQAuth') {
    console.log('CATCH cookies')
    sendResponse({gqauth: getCookie('gqauth')})
  } else if (message.action === "addLoader") {
    addLoader();
    addLegoPabShortcut();
  } else if (message.action === "updateData") {
    updateData(message.sellerData);
  }
});

function getCookie(cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
}
