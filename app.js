// Paste your Vercel Edge Config connection URL here
const VERCEL_JSON_URL = "https://edge-config.vercel.com/ecfg_srdqey6cikfart3lha8pbdldtguu?token=a3a0dac7-4a8f-43e6-8a27-e6f847afdf45";

let listItems = [];

// Load the JSON data from your Vercel storage
async function loadList() {
    try {
        const response = await fetch(VERCEL_JSON_URL);
        if (response.ok) {
            const data = await response.json();
            // Pull the items array from your Vercel JSON structure
            listItems = data.props.items || [];
        }
    } catch (error) {
        console.error("Error reading JSON file:", error);
    }
    renderUI();
}

// Write the JSON data back to your Vercel storage
async function saveToServer() {
    try {
        await fetch(VERCEL_JSON_URL, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: listItems
            })
        });
    } catch (error) {
        console.error("Error updating JSON file:", error);
    }
}

// Generate the user interface items based on the data
function renderUI() {
    document.getElementById('loader').classList.add('hidden');
    const container = document.getElementById('list-container');
    container.classList.remove('hidden');
    container.innerHTML = '';

    if (listItems.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 text-sm py-8">The list is completely empty!</p>`;
        return;
    }

    listItems.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = `flex items-center gap-3 p-4 rounded-xl border transition-all ${
            item.bought ? 'bg-gray-100 opacity-60 border-transparent' : 'bg-white shadow-sm border-gray-100'
        }`;

        wrapper.innerHTML = `
            <button onclick="toggleItem(${index})" class="w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${
                item.bought ? 'bg-[#3525cd] border-[#3525cd] text-white' : 'border-gray-300'
            }">
                ${item.bought ? '<span class="material-symbols-outlined text-sm font-bold">check</span>' : ''}
            </button>
            <span class="flex-grow text-base ${item.bought ? 'item-checked' : ''}">${item.text}</span>
            <button onclick="deleteItem(${index})" class="text-gray-300 hover:text-red-500 transition-colors">
                <span class="material-symbols-outlined text-xl">delete</span>
            </button>
        `;
        container.appendChild(wrapper);
    });
}

// Add Item when Enter key is pressed
document.getElementById('item-input').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '') {
        const newItem = { text: e.target.value.trim(), bought: false };
        listItems.push(newItem);
        e.target.value = '';
        renderUI();
        await saveToServer();
    }
});

// Toggle Checked Style State
async function toggleItem(index) {
    listItems[index].bought = !listItems[index].bought;
    renderUI();
    await saveToServer();
}

// Delete Item
async function deleteItem(index) {
    listItems.splice(index, 1);
    renderUI();
    await saveToServer();
}

function refreshList() {
    document.getElementById('list-container').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    loadList();
}

// Run loading function on startup
loadList();