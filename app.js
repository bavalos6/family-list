// Extracted credentials from your Edge Config link
const EDGE_CONFIG_ID = "ecfg_srdqey6cikfart3lha8pbdldtguu";
// This tells your app to look for the variable injected by Vercel
const VERCEL_WRITE_TOKEN = window.process?.env?.VERCEL_WRITE_TOKEN || "";

// Correct Vercel read and write API endpoints
const READ_URL = `https://edge-config.vercel.com/${EDGE_CONFIG_ID}`;
const WRITE_URL = `https://api.vercel.com/v1/edge-config/${VERCEL_WRITE_TOKEN}/items`;

let allLists = [];
let currentListId = null; // null means we are looking at the dashboard selection page

// 1. Fetch the entire JSON data from Vercel
async function loadData() {
    try {
        const response = await fetch(READ_URL);
        if (response.ok) {
            const data = await response.json();
            allLists = data.lists || [];
        }
    } catch (error) {
        console.error("Error reading JSON:", error);
    }
    renderUI();
}

// 2. Write the entire updated lists object structure back to Vercel securely
async function saveToServer() {
    try {
        await fetch(WRITE_URL, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${TEAM_OR_USER_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: [
                    {
                        operation: 'update',
                        key: 'lists',
                        value: allLists
                    }
                ]
            })
        });
    } catch (error) {
        console.error("Error updating Vercel storage file:", error);
    }
}

// 3. Dynamic App Rendering Layout Router
function renderUI() {
    document.getElementById('loader').classList.add('hidden');
    const container = document.getElementById('list-container');
    container.classList.remove('hidden');
    container.innerHTML = '';

    if (currentListId === null) {
        // --- VIEW A: DASHBOARD MODE (Showing all available lists) ---

        // Dynamic List Grid
        allLists.forEach(list => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-xl p-5 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer";
            card.onclick = () => {
                currentListId = list.id;
                renderUI();
            };
            card.innerHTML = `
                <h3 class="text-lg font-bold text-[#191c1e]">${list.name}</h3>
                <span class="text-xs text-gray-400 block mt-1">${list.items.length} items • Tap to open</span>
            `;
            container.appendChild(card);
        });

        // Add Create New List Input Inline Form at the Bottom
        const createForm = document.createElement('div');
        createForm.className = "mt-6 flex gap-2";
        createForm.innerHTML = `
            <input id="new-list-input" type="text" placeholder="Create new list (e.g. Target)..." 
                   class="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none text-sm" />
            <button onclick="createNewList()" class="bg-[#3525cd] text-white px-5 rounded-xl text-sm font-medium active:scale-95 transition-transform">
                Create
            </button>
        `;
        container.appendChild(createForm);

        // Hide main input bar when on dashboard
        document.getElementById('item-input').parentElement.parentElement.classList.add('hidden');

    } else {
        // --- VIEW B: SINGLE LIST MODE (Viewing items inside selected list) ---

        const activeList = allLists.find(l => l.id === currentListId);
        if (!activeList) {
            currentListId = null;
            renderUI();
            return;
        }

        // Show main list interactive input input wrapper field
        document.getElementById('item-input').parentElement.parentElement.classList.remove('hidden');
        document.getElementById('item-input').placeholder = `Add to ${activeList.name}...`;

        // Render back navigation header link
        const backBtn = document.createElement('button');
        backBtn.className = "flex items-center gap-1 text-sm font-semibold text-[#3525cd] mb-4 active:scale-95 transition-transform";
        backBtn.onclick = () => { currentListId = null; renderUI(); };
        backBtn.innerHTML = `<span class="material-symbols-outlined text-sm">arrow_back</span> Back to Lists`;
        container.appendChild(backBtn);

        if (activeList.items.length === 0) {
            container.innerHTML += `<p class="text-center text-gray-400 text-sm py-8">No items in this list yet!</p>`;
            return;
        }

        activeList.items.forEach((item, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = `flex items-center gap-3 p-4 rounded-xl border transition-all ${item.bought ? 'bg-gray-100 opacity-60 border-transparent' : 'bg-white shadow-sm border-gray-100'
                }`;

            wrapper.innerHTML = `
                <button onclick="toggleItem(${index})" class="w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all ${item.bought ? 'bg-[#3525cd] border-[#3525cd] text-white' : 'border-gray-300'
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
}

// Create New List Action
async function createNewList() {
    const input = document.getElementById('new-list-input');
    const name = input.value.trim();
    if (!name) return;

    const newList = {
        id: 'list_' + Date.now(),
        name: name,
        items: []
    };

    allLists.push(newList);
    currentListId = newList.id;
    renderUI();
    await saveToServer();
}

// Add Item Execution Action Listener Hook
document.getElementById('item-input').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && e.target.value.trim() !== '' && currentListId !== null) {
        const activeList = allLists.find(l => l.id === currentListId);
        if (activeList) {
            activeList.items.push({ text: e.target.value.trim(), bought: false });
            e.target.value = '';
            renderUI();
            await saveToServer();
        }
    }
});

// Toggle Item Bought Checked State
async function toggleItem(index) {
    const activeList = allLists.find(l => l.id === currentListId);
    if (activeList) {
        activeList.items[index].bought = !activeList.items[index].bought;
        renderUI();
        await saveToServer();
    }
}

// Delete Item Action Handler
async function deleteItem(index) {
    const activeList = allLists.find(l => l.id === currentListId);
    if (activeList) {
        activeList.items.splice(index, 1);
        renderUI();
        await saveToServer();
    }
}

function refreshList() {
    document.getElementById('list-container').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    loadData();
}

// Initialize startup load sequence execution
loadData();