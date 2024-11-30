import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://cartsys-5587a-default-rtdb.asia-southeast1.firebasedatabase.app/"
}

const app = initializeApp(appSettings)
const database = getDatabase(app)
const shoppingListInDB = ref(database, "shoppingList")

const inputFieldEl = document.getElementById('input');
const quantityFieldEl = document.getElementById('quantity');
const addButtonEl = document.getElementById('button');
const shoppingListEl = document.getElementById("shopping-list")

onValue(shoppingListInDB, function (snapshot) {
    if (snapshot.exists()) {
        let itemsArray = Object.entries(snapshot.val());
        console.log(snapshot.val());

        clearShoppingListEl();

        for (let i = 0; i < itemsArray.length; i++) {
            let currentItem = itemsArray[i];
            appendItemToShoppingListEl(currentItem);
        }
    } else {
        shoppingListEl.innerHTML = "NO ITEMS HERE ...";
    }
});

// Button click handler
addButtonEl.addEventListener("click", function () {
    let itemValue = inputFieldEl.value.trim();
    let quantityValue = parseInt(quantityFieldEl.value.trim(), 10);

    // Ensure both item name and quantity are valid
    if (itemValue !== "" && quantityValue > 0) {
        // Push the new item and quantity to the database
        push(shoppingListInDB, { item: itemValue, quantity: quantityValue });
    }

    clearInputFieldEl();
    clearQuantityFieldEl();
    console.log(`${itemValue} (x${quantityValue}) added to database`);
});

function clearShoppingListEl() {
    shoppingListEl.innerHTML = "";
}

function clearInputFieldEl() {
    inputFieldEl.value = "";
}

function clearQuantityFieldEl() {
    quantityFieldEl.value = "";
}

function appendItemToShoppingListEl(item) {
    let itemID = item[0];
    let itemValue = item[1].item;
    let itemQuantity = item[1].quantity;

    let newEl = document.createElement("li");
    newEl.textContent = `${itemValue} (x${itemQuantity})`;

    newEl.addEventListener("click", function () {
        let exactLocationOfItemInDB = ref(database, `shoppingList/${itemID}`);
        remove(exactLocationOfItemInDB);
    });

    shoppingListEl.append(newEl);
}