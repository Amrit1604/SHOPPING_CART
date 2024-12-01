import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

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
            boughtTime: null // Initially, no bought time
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
    li.id = id; // Set the ID for easy reference
    li.classList.add("shopping-item"); // Add a class for styling
    li.innerHTML = `
        <div class="item-details">
            <strong>${item.name}</strong> (${item.quantity}) - ${item.category} <br>
            <small class="item-meta">Added by: ${item.addedBy}</small>
        </div>
        <div>
            <button class="status-button ${item.status === "bought" ? "bought" : ""}">
                ${item.status === "bought" ? "Bought" : "Mark as Bought"}
            </button>
            ${localStorage.getItem("familyMember") === item.addedBy
                ? `<button class="remove-item">Remove</button>`
                : ""
            }
        </div>
        ${item.status === "bought" ? `<p class="bought-time">Bought at: ${item.boughtTime}</p>` : ""}
    `;

    const statusBtn = li.querySelector(".status-button");
    const removeBtn = li.querySelector(".remove-item");

    // Toggle Bought Status
    statusBtn.addEventListener("click", () => {
        const newStatus = item.status === "bought" ? "not-bought" : "bought";
        const boughtTime = newStatus === "bought" ? new Date().toLocaleString() : null;
        updateItemStatus(id, newStatus, boughtTime);
    });

    // Remove Item (only if added by the current user)
    if (removeBtn) {
        removeBtn.addEventListener("click", () => removeItem(id));
    }

    shoppingListEl.appendChild(li);
}

// Update Item Status in Firebase and Animation
function updateItemStatus(id, status, boughtTime) {
    const itemRef = ref(database, `shoppingList/${id}`);
    update(itemRef, { status, boughtTime });

    // Get the updated item element
    const itemElement = document.getElementById(id);
    const statusBtn = itemElement.querySelector(".status-button");
    const boughtTimeEl = itemElement.querySelector(".bought-time");

    // Add animation and update button text and color
    if (status === "bought") {
        itemElement.classList.add("bought-item"); // Add class for animation
        statusBtn.textContent = "Bought";
        statusBtn.classList.add("bought");
        boughtTimeEl.textContent = `Bought at: ${boughtTime}`;
    } else {
        itemElement.classList.remove("bought-item");
        statusBtn.textContent = "Mark as Bought";
        statusBtn.classList.remove("bought");
        boughtTimeEl.textContent = "";
    }
}

// Remove Item from Firebase
function removeItem(id) {
    const itemRef = ref(database, `shoppingList/${id}`);
    remove(itemRef);
}
