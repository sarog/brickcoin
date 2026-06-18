let legoToBricklinkColors = {};
let bricklinkToLegoIds = {};
let legoToBricklinkId = {};

let legoAuth = null
let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:151.0) Gecko/20100101 Firefox/151.0";

// chrome.chromeAction.onClicked.addListener(() => {
//   chrome.runtime.openOptionsPage().catch((error) => {
//     console.error("Error opening options page:", error);
//   });
// });

async function getLegoConfig() {
  return await chrome.storage.sync.get(["language_code", "country_code"]).then((items) => {
    console.log(items);
    return `${items.language_code}-${items.country_code}`
  });
}

async function getLegoConfig() {
  const items = await chrome.storage.sync.get(["language_code", "country_code"]);

  if (!items.language_code || !items.country_code) {
    // Open the options.html page in a new window
    const popup = await chrome.windows.create({
      url: chrome.runtime.getURL("options.html"),
      type: "popup"
    });

    // Wait for the popup window to close
    await new Promise((resolve) => {
      const listener = (windowId) => {
        if (windowId === popup.id) {
          chrome.windows.onRemoved.removeListener(listener);
          resolve();
        }
      };
      chrome.windows.onRemoved.addListener(listener);
    });

    // Re-fetch the data after the popup is closed
    const updatedItems = await chrome.storage.sync.get(["language_code", "country_code"]);
    if (!updatedItems.language_code || !updatedItems.country_code) {
      throw new Error("User did not provide the necessary configuration.");
    }
    return `${updatedItems.language_code}-${updatedItems.country_code}`;
  }

  // If everything exists, return the configuration
  return `${items.language_code}-${items.country_code}`;
}


async function loadColorMappings() {
  try {
    const response = await fetch(
      chrome.runtime.getURL("data/lego_to_bricklink_colors.json")
    );
    legoToBricklinkColors = await response.json();
  } catch (error) {
    console.error("Error fetching JSON:", error);
  }
}

async function loadIdsMappings() {
  try {
    const response = await fetch(
      chrome.runtime.getURL("data/bricklink_id_to_lego.json")
    );
    bricklinkToLegoIds = await response.json();
    legoToBricklinkId = Object.entries(bricklinkToLegoIds).reduce((acc, [key, values]) => {
      values.forEach(value => {
        acc[value] = key;
      });
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching JSON:", error);
  }
}

async function fetchCartData(sids) {
  const sellersData = {};
  const locale = await getLegoConfig()
  for (const sid of sids) {
    try {
      const response = await fetch(
        `https://www.bricklink.com/ajax/renovate/cart/getStoreCart.ajax`,
        {
          headers: createCartHeaders(sid),
          body: `sid=${sid}`,
          method: "POST",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const items = extractCartItems(data.cart.items, data.cart.viewCurrency.trim());
        
        const itemNos = items.map((item) => item.itemLego).join(" ");

        const allExtractedItems = await fetchLegoData(locale, itemNos);
        const comparison = compareBricklinkAndPAB(items, allExtractedItems)

        sellersData[sid] = {
          totalItems: data.cart.totalItems,
          totalLots: data.cart.totalLots,
          totalPriceRaw: data.cart.totalPrice.replace(/[^\d\.]*/g, ''),
          sid: sid,
          comparison: comparison,
          items,
          // allExtractedItems,
        };
        updateData(sellersData[sid]);

        console.log(`Data for SID ${sid}:`, sellersData[sid]);
      } else {
        console.error(
          `Error fetching data for SID ${sid}:`,
          response.statusText
        );
      }
    } catch (error) {
      console.error(`Fetch error for SID ${sid}:`, error);
    }
  }
  return sellersData;
}

function compareBricklinkAndPAB(items, allExtractedItems) {
  let comparison = {
    'pab': {'totalSave': 0, 'listOfItems': [], 'total_bricklink': 0, 'total_lego': 0},
    'bap': {'totalSave': 0, 'listOfItems': [], 'total_bricklink': 0, 'total_lego': 0},
    'pab_bricklink': {'totalSave': 0, 'listOfItems': [], 'total_bricklink': 0, 'total_lego': 0},
    'bap_bricklink': {'totalSave': 0, 'listOfItems': [], 'total_bricklink': 0, 'total_lego': 0},
    'bricklink': {'listOfItems': [], 'total_bricklink': 0},
    'legoCurrency': null,
    'cartCurrency': null
  }
  console.log(items)
  let is_ok;
  for (let item of items) {
    console.log(item);
    if (item.itemNo in bricklinkToLegoIds) {
      is_ok = false;
      for (let legoId of bricklinkToLegoIds[item.itemNo]) {
        if (legoId in allExtractedItems && item.colorID in allExtractedItems[legoId]) {
          legoItem = allExtractedItems[legoId][item.colorID]
          if (comparison.legoCurrency == null) {
            comparison.legoCurrency = legoItem.legoCurrency
          }
          else if (comparison.legoCurrency != legoItem.legoCurrency) {
            comparison.legoCurrency = 'ERROR'
          }
          if (item.unitPrice >= (legoItem.price / 100)) {
            comparison[legoItem.cartType].totalSave += (item.unitPrice - (legoItem.price / 100)) * item.cartQty
            comparison[legoItem.cartType].listOfItems.push({'sku': legoItem.sku, 'quantity': item.cartQty, 'invID': item.invID})
            comparison[legoItem.cartType].total_lego += (legoItem.price / 100) * item.cartQty
            comparison[legoItem.cartType].total_bricklink += item.unitPrice * item.cartQty
          } else {
            comparison[`${legoItem.cartType}_bricklink`].totalSave += ((legoItem.price / 100) - item.unitPrice) * item.cartQty
            comparison[`${legoItem.cartType}_bricklink`].listOfItems.push({'sku': legoItem.sku, 'quantity': item.cartQty, 'invID': item.invID})
            comparison[`${legoItem.cartType}_bricklink`].total_lego += (legoItem.price / 100) * item.cartQty
            comparison[`${legoItem.cartType}_bricklink`].total_bricklink += item.unitPrice * item.cartQty
          }
          is_ok = true;
          break;
        }
      }
      if (!is_ok) {
        comparison.bricklink.listOfItems.push({'quantity': item.cartQty, 'invID': item.invID})
        comparison.bricklink.total_bricklink += item.unitPrice * item.cartQty
      }
    } else {
      console.log('3 ITEM', item.itemNo, item.colorID)
      comparison.bricklink.listOfItems.push({'quantity': item.cartQty, 'invID': item.invID})
      comparison.bricklink.total_bricklink += item.unitPrice * item.cartQty
    }
    if (comparison.cartCurrency == null) {
      comparison.cartCurrency = item.cartCurrency;
    } else if (comparison.cartCurrency != item.cartCurrency) {
      comparison.cartCurrency = 'ERROR2';
    }
  }
  return comparison
}

async function addLoader() {
  chrome.tabs.query({url: '*://www.bricklink.com/v2/globalcart*'}, function (tabs) {
    chrome.scripting.executeScript({
      target: {tabId: tabs[0].id},
      files: ["content.js"]
    }).then(() => {
      // After ensuring the script is loaded, send the message
      chrome.tabs.sendMessage(tabs[0].id, {action: "addLoader"});
    }).catch((error) => {
      console.error("Failed to inject content script:", error);
    });
  });
}

async function updateData(sellerData) {
  console.log('update')
  chrome.tabs.query({url: '*://www.bricklink.com/v2/globalcart*'}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "updateData", sellerData: sellerData});
  });
}

function createCartHeaders(sid) {
  return {
    "User-Agent": userAgent,
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": `https://www.bricklink.com/v2/globalcart.page?sid=${sid}`,
  };
}

function extractCartItems(cartItems, currency) {
  console.log('extractCartItems')
  return cartItems.map((item) => ({
    itemNo: item.itemNo,
    itemLego: item.itemNo in bricklinkToLegoIds ? bricklinkToLegoIds[item.itemNo].join(" ") : item.itemNo,
    colorID: item.colorID,
    colorName: item.colorName,
    cartQty: item.cartQty,
    cartCurrency: currency,
    // totalNativeSalePriceRaw: parseFloat(item.totalSalePrice.replace(/[^\d\.]*/g, '')),
    totalNativeSalePriceRaw: item.totalNativeSalePriceRaw,
    unitPrice: parseFloat(item.totalSalePrice.replace(/[^\d\.]*/g, '')) / item.cartQty,
    invID: item.invID
  }));
}

async function fetchLegoData(locale, itemNos, page = 1, allExtractedItems = {}) {
  try {
    const response = await fetch(
      "https://www.lego.com/api/graphql/PickABrickQuery",
      {
        headers: createLegoHeaders(locale),
        body: JSON.stringify(createLegoRequestBody(itemNos, page)),
        method: "POST",
      }
    );

    const data = await response.json();
    if (data && data.data && data.data.searchElements) {
      processLegoItems(data.data.searchElements.results, allExtractedItems);

      if (data.data.searchElements.count < data.data.searchElements.total && data.data.searchElements.count > 0) {
        await fetchLegoData(locale, itemNos, page + 1, allExtractedItems);
      }
    }
  } catch (error) {
    console.error("Error during LEGO API request:", error);
  }
  return allExtractedItems;
}

function createLegoHeaders(locale) {
  console.log(locale)
  return {
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
    "Content-Type": "application/json",
    "x-locale": locale,
  };
}

function createLegoRequestBody(itemNos, page) {
  return {
    operationName: "PickABrickQuery",
    variables: { input: { perPage: 400, query: itemNos, page } },
    query: `query PickABrickQuery($input: ElementQueryInput!) { 
              searchElements(input: $input) { 
                results { id designId name imageUrl maxOrderQuantity deliveryChannel price { currencyCode centAmount formattedAmount } facets { color { key name } } inStock } 
                total count 
              } 
            }`,
  };
}

function processLegoItems(items, allExtractedItems) {
  items.forEach((item) => {
    const { designId, facets, price, id: sku, deliveryChannel } = item;
    const colorKey = facets.color.key;
    const colorName = facets.color.name;
    const centAmount = price.centAmount;
    const currencyCode = price.currencyCode;

    if (!allExtractedItems[designId]) allExtractedItems[designId] = {};
    allExtractedItems[designId][legoToBricklinkColors[colorKey]] = {
      price: centAmount,
      legoCurrency: currencyCode,
      colorName,
      legoColorKey: colorKey,
      sku,
      cartType: deliveryChannel,
    };
  });
}

function createPrepareCheckoutHeaders(locale) {
  console.log(locale)
  return {
    "User-Agent": userAgent,
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.5",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest"
  };
}

async function handleCheckoutRequest(details) {
  console.log(details)
  if ((details.method === "POST" || details.method === "GET") && (('originUrl' in details && details.originUrl.startsWith("https://www.bricklink.com")) || ('initiator' in details && details.initiator.startsWith("https://www.bricklink.com"))) ) {
    try {
      const response = await fetch(details.url, {
        method: details.method,
        body: details.requestBody ? new URLSearchParams(details.requestBody.formData) : undefined,
        header: createPrepareCheckoutHeaders()
      });
      const responseData = await response.json();
      const sids = responseData.sellers.map((item) => item.sid);
      
      addLoader();
      const sellersData = await fetchCartData(sids);
      console.log("Sellers Data:", sellersData);
    } catch (error) {
      console.error("Failed to handle response:", error);
    }
  }
}

chrome.webRequest.onBeforeRequest.addListener(
  handleCheckoutRequest,
  {
    urls: ["https://www.bricklink.com/ajax/clone/store/preparecheckout.ajax"],
  },
  ["requestBody"]
);

function createRemoveCartHeader() {
  return {
    "accept": "application/json, text/javascript, */*; q=0.01",
    "accept-language": "en-US,en;q=0.9,fr;q=0.8",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "priority": "u=1, i",
    "X-Requested-With": "XMLHttpRequest",
  }
}

function removeFromCart(items, sid) {
  let itemArray = []
  let superlotArray = []
  for (item of items) {
    itemArray.push({invID: String(item.invID), invQty:0})
  }
  fetch("https://www.bricklink.com/ajax/renovate/cart/delete.ajax", {
    "headers": createRemoveCartHeader(),
    "body": `sid=${sid}&itemArray=${encodeURIComponent(JSON.stringify(itemArray))}&superlotArray=${encodeURIComponent(JSON.stringify(superlotArray))}`,
    "method": "POST"
  });
}

async function requestLegoAuth() {
  try {
    const tabs = await chrome.tabs.query({ url: '*://*.lego.com/*', status: 'complete' });
    console.log(tabs)
    if (tabs.length > 0) {
      response = await chrome.tabs.sendMessage(tabs[0].id, { action: "readCookieGQAuth" });
      console.log('cookies', response);
      legoAuth = response.gqauth
    } else {
      console.log("No matching tabs found.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function formatItems4Pab(items) {
  return items.map((item) => ({sku: item.sku, quantity: item.quantity}));
}

async function add2Pab(items, cartType, locale) {
  console.log(items, cartType)
  console.log(formatItems4Pab(items))
  console.log(legoAuth)
  var PickABrickQuery = {
    operationName: 'ElementCartsAddToCart',
    variables: {
      items: formatItems4Pab(items),
      cartType: cartType,
      returnCarts: [],
    },
    query:
      'mutation ElementCartsAddToCart($items: [ElementInput!]!, $cartType: CartType!, $returnCarts: [CartType!]!) {\n  elementCartsAddToCart(\n    input: {items: $items, cartType: $cartType, returnCarts: $returnCarts}\n  ) {\n    carts {\n      ...BrickCartData\n    }\n  }\n}\n\nfragment BrickCartData on BrickCart {\n  id\n}\n',
  };

  var url = 'https://www.lego.com/api/graphql/AddToElementCart';

  // Fetch request to the API
  var response = await fetch(url, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'x-locale':  locale,
      'authorization': legoAuth,
    },
    body: JSON.stringify(PickABrickQuery),
  });

  if (response.status < 200 || response.status >= 300) {
    const errorResponse = await response.json();
    console.error('Error adding to cart:', errorResponse);
    return {
      status: response.status,
      message: errorResponse,
    };
  }

  // Successfully added to cart
  var jsonResponse = await response.json();
  console.log("Successfully added to cart PAB:", jsonResponse);
}

async function openPickABrick() {
  let locale = await getLegoConfig()
  var url = `https://www.lego.com/${locale}/page/static/pick-a-brick`;

  const tabs = await chrome.tabs.query({url: '*://*.lego.com/*', status: 'complete'});
  if (tabs.length > 0) {
    chrome.tabs.update(tabs[0].id, {
      url: url,
      active: true,
    }).catch(error => console.log(error));
  } else {
    chrome.tabs.create({url: url, active: true})
  }

  return true;
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  // Check if the message is for the button click
  if (request.action === "add_2_pab") {
    var locale = await getLegoConfig()
    if (legoAuth == null) {
      await requestLegoAuth()
      console.log('FETCH cookies')
      console.log(legoAuth)
    }
    add2Pab(request.items, request.cartType, locale)
    
      // add_2_pab(request.add_2_pab_items, request.add_2_bap_items, request.autho)
  } else if (request.action === "remove_from_cart") {
    console.log(request)
    removeFromCart(request.items, request.sid)
  } else if (request.action === "pab_shortcut") {
    openPickABrick()
  }
});

loadColorMappings();
loadIdsMappings();
