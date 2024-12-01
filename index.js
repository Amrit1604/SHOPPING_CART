import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Firebase Configuration
const appSettings = {
    databaseURL: "https://cartsys-5587a-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(appSettings);
const database = getDatabase(app);
const shoppingListInDB = ref(database, "shoppingList");

// DOM Elements
const inputFieldEl = document.getElementById("input-field");
const quantityInputEl = document.getElementById("quantity-input");
const categoryInputEl = document.getElementById("category-input");
const addButtonEl = document.getElementById("add-button");
const shoppingListEl = document.getElementById("shopping-list");
const familyMemberInput = document.getElementById("family-member-input");
const saveMemberBtn = document.getElementById("save-member-btn");
const clearAllBtn = document.getElementById("clear-all-btn");

// Load saved family member name
document.addEventListener('DOMContentLoaded', () => {
    const savedMember = localStorage.getItem('familyMember');
    if (savedMember) {
        familyMemberInput.value = savedMember;
    }
});

// Save Family Member
saveMemberBtn.addEventListener("click", function () {
    const memberName = familyMemberInput.value.trim();
    if (memberName) {
        localStorage.setItem('familyMember', memberName);
        alert(`Welcome, ${memberName}!`);
    }
});

// Add Item to Firebase
addButtonEl.addEventListener("click", function () {
    const itemName = inputFieldEl.value.trim();
    const quantity = parseInt(quantityInputEl.value) || 1;
    const category = categoryInputEl.value || "Uncategorized";
    const addedBy = localStorage.getItem("familyMember") || "Anonymous";

    if (itemName) {
        push(shoppingListInDB, {
            name: itemName,
            quantity,
            category,
            addedBy,
            status: "not-bought",
            boughtTime: null,
            boughtBy: null
        });

        inputFieldEl.value = "";
        quantityInputEl.value = "1";
        categoryInputEl.value = "";
    }
});

// Clear All Items
clearAllBtn.addEventListener("click", function () {
    if (confirm("Clear all items?")) {
        remove(shoppingListInDB);
    }
});

// Fetch and Render Items
onValue(shoppingListInDB, function (snapshot) {
    shoppingListEl.innerHTML = "";
    if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([id, item]) => {
            renderItem(id, item);
        });
    } else {
        shoppingListEl.innerHTML = "<li class='placeholder'>No items here... yet</li>";
    }
});

// Render Item
function renderItem(id, item) {
    const li = document.createElement("li");
    li.id = id;
    // Add green background when bought
    li.classList.add("shopping-item");
    if (item.status === "bought") {
        li.classList.add("item-bought");
    }
    
    // Always show bought details if item is bought
    const boughtDetailsHtml = item.status === "bought" ? `
        <div class="bought-details">
            <p class="bought-time">Bought at: ${item.boughtTime || 'Unknown time'}</p>
            <p class="bought-by">Bought by: ${item.boughtBy || 'Unknown buyer'}</p>
        </div>
    ` : '';

    // Add space between buttons
    const buttonsHtml = `
        <div class="item-actions">
            <button class="status-button ${item.status === "bought" ? "bought" : ""}">
                ${item.status === "bought" ? "Bought" : "Mark as Bought"}
            </button>
            ${localStorage.getItem("familyMember") === item.addedBy
                ? `<span class="button-spacer"></span>
                   <button class="remove-item">Remove</button>`
                : ""
            }
        </div>
    `;

    li.innerHTML = `
        <div class="item-details">
            <strong>${item.name}</strong> (${item.quantity}) - ${item.category} <br>
            <small class="item-meta">Added by: <span class="added-by">${item.addedBy}</span></small>
        </div>
        ${buttonsHtml}
        ${boughtDetailsHtml}
    `;

    const statusBtn = li.querySelector(".status-button");
    const removeBtn = li.querySelector(".remove-item");

    // Toggle Bought Status
    statusBtn.addEventListener("click", () => {
        const newStatus = item.status === "bought" ? "not-bought" : "bought";
        const boughtTime = newStatus === "bought" ? new Date().toLocaleString() : null;
        const boughtBy = newStatus === "bought" ? localStorage.getItem("familyMember") : null;
        updateItemStatus(id, newStatus, boughtTime, boughtBy);
    });

    // Remove Item (only if added by the current user)
    if (removeBtn) {
        removeBtn.addEventListener("click", () => removeItem(id, item.addedBy));
    }

    shoppingListEl.appendChild(li);
}

// Update Item Status in Firebase
function updateItemStatus(id, status, boughtTime, boughtBy) {
    const itemRef = ref(database, `shoppingList/${id}`);
    update(itemRef, { status, boughtTime, boughtBy });
}

// Remove Item from Firebase
async function removeItem(id, addedBy) {
    // Extra verification to ensure only the person who added the item can remove it
    const currentUser = localStorage.getItem("familyMember");
    
    if (currentUser !== addedBy) {
        alert("You can only remove items you've added!");
        return;
    }

    try {
        const itemRef = ref(database, `shoppingList/${id}`);
        await remove(itemRef);
        console.log(`Item ${id} removed successfully`);
    } catch (error) {
        console.error("Error removing item:", error);
        alert("Failed to remove item. Please try again.");
    }
}

// Recommended CSS to add to your stylesheet
const styleElement = document.createElement('style');
styleElement.textContent = `
    .shopping-item {
        transition: all 0.3s ease;
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 5px;
        position: relative;
    }

    .shopping-item.item-bought {
        background-color: #4CAF50; /* Green background */
        color: white; /* White text */
    }

    .item-bought .item-meta,
    .item-bought strong,
    .item-bought .item-details {
        color: white !important;
    }

    .item-bought .status-button {
        background-color: white;
        color: #4CAF50;
    }

    .item-bought .remove-item {
        background-color: #45a049;
        color: white;
    }

    .bought-details {
        margin-top: 10px;
        font-size: 0.9em;
    }
`;
document.head.appendChild(styleElement);


if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').then(function (registration) {
        console.log('Service Worker registered with scope:', registration.scope);
      }).catch(function (error) {
        console.log('Service Worker registration failed:', error);
      });
    });
  }

