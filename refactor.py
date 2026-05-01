import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update BACKEND_URL
content = content.replace("const BACKEND_URL = 'http://localhost:3000';", "const BACKEND_URL = 'http://localhost:3001';")

# 2. Add Socket.io Initialization at the top of DOMContentLoaded
content = content.replace(
    "document.addEventListener('DOMContentLoaded', () => {",
    "document.addEventListener('DOMContentLoaded', () => {\n    window.socket = io(BACKEND_URL);\n"
)

# 3. Replace Auth logic
old_auth = """                if (!window.supabaseClient) throw new Error("Supabase is not initialized!");
                
                let data, error;
                if (isSignUpMode) {
                    const res = await window.supabaseClient.auth.signUp({
                        email,
                        password,
                        options: { data: { full_name: authNameInput.value.trim() } }
                    });
                    data = res.data;
                    error = res.error;
                } else {
                    const res = await window.supabaseClient.auth.signInWithPassword({
                        email,
                        password
                    });
                    data = res.data;
                    error = res.error;
                }"""

new_auth = """                let data, error;
                const endpoint = isSignUpMode ? '/auth/signup' : '/auth/login';
                const body = { email, password, full_name: authNameInput?.value?.trim() };
                
                const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                const resData = await res.json();
                
                if (!res.ok) {
                    error = { message: resData.error };
                } else {
                    data = { user: resData.user };
                    localStorage.setItem('unibuzz_token', resData.token);
                }"""

content = content.replace(old_auth, new_auth)

# 4. Replace Session Check
old_session = """        if (window.supabaseClient) {
            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                handleSession(session);
            }).catch(() => handleSession(null));
        } else {
            handleSession(null);
        }"""

new_session = """        const token = localStorage.getItem('unibuzz_token');
        if (token) {
            fetch(`${BACKEND_URL}/auth/session`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()).then(data => {
                if(data.user) {
                    handleSession({ user: data.user });
                } else { handleSession(null); }
            }).catch(() => handleSession(null));
        } else {
            handleSession(null);
        }"""
content = content.replace(old_session, new_session)

# 5. Remove 'if (window.supabaseClient)' from initApp
content = content.replace("    if (window.supabaseClient) {\n        await fetchProfiles();\n        await fetchGroups();\n        await fetchListings();\n        initRealtime();\n    }", 
"    await fetchProfiles();\n    await fetchGroups();\n    await fetchListings();\n    initRealtime();")

# 6. Override fetchProfiles
new_funcs = """

// --- MONGODB MIGRATION OVERRIDES ---
window.getAuthHeaders = () => {
    return { 'Authorization': `Bearer ${localStorage.getItem('unibuzz_token')}`, 'Content-Type': 'application/json' };
};

window.logout = function () {
    if (confirm("Logout from UNIBUZZ? 🥺")) {
        const lastUser = { name: currentUser.name, avatar: currentUser.avatar, email: currentUser.email };
        localStorage.setItem('last_user', JSON.stringify(lastUser));
        localStorage.removeItem('unibuzz_session');
        localStorage.removeItem('unibuzz_token');
        location.reload();
    }
};

async function fetchProfiles() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/profiles`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data && data.length) {
            data.forEach(p => {
                users[p.id] = { id: p.id, name: p.name, avatar: p.avatar, bio: p.bio, phone: p.phone, email: p.email };
                if (p.id === currentUser.id) {
                    Object.assign(currentUser, p);
                    document.getElementById('profile-display-name').textContent = p.name;
                    document.getElementById('profile-sidebar-img').src = p.avatar;
                }
            });
        }
    } catch(e) {}
}

async function fetchGroups() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/groups`, { headers: getAuthHeaders() });
        const groups = await res.json();
        
        const mRes = await fetch(`${BACKEND_URL}/api/messages`, { headers: getAuthHeaders() });
        const allMessages = await mRes.json();
        
        groups.forEach(g => {
            if(!g.members) g.members = [];
            if(!g.admins) g.admins = [];
            const groupMsgs = allMessages ? allMessages.filter(msg => msg.chat_id === g.id) : [];
            g.messages = groupMsgs.length > 0 ? groupMsgs.map(row => ({
                id: row.id,
                senderId: row.sender_id,
                text: row.text,
                image: row.image,
                timestamp: new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })) : [{ senderId: 'system', text: 'Welcome!', timestamp: '' }];
        });

        groupsData = [...groups.filter(g => g.type === 'group')];
        communitiesData = [...groups.filter(g => g.type === 'community')];
        const dbChats = groups.map(g => {
            if (g.type === 'direct') {
                g.participants = g.members;
                const otherUserId = g.members.find(id => id !== currentUser.id);
                if (otherUserId && users[otherUserId]) {
                    g.topic = users[otherUserId].name;
                    g.avatar = users[otherUserId].avatar;
                }
            }
            return g;
        });
        chatsData = [];
        dbChats.forEach(dbC => {
            if (!chatsData.find(d => d.id === dbC.id)) chatsData.push(dbC);
        });
    } catch(e) {}
}

async function fetchListings() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/listings`, { headers: getAuthHeaders() });
        const data = await res.json();
        if (data && data.length) {
            lostFoundData.length = 0;
            data.forEach(item => {
                lostFoundData.push({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    description: item.description,
                    author: item.author_id,
                    timestamp: new Date(item.createdAt).toLocaleDateString(),
                    image: item.image_url,
                    contact: item.contact
                });
            });
        }
    } catch(e) {}
}

async function syncUserProfile() {
    if (!currentUser.id) return;
    try {
        await fetch(`${BACKEND_URL}/api/profiles`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(currentUser)
        });
    } catch (e) {}
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;

    try {
        await fetch(`${BACKEND_URL}/api/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ chat_id: activeChatId, text })
        });
        messageInput.value = '';
        scrollToBottom();
    } catch(e) {
        alert("Failed to send message.");
    }
}

async function sendAttachment(base64Image) {
    if (!activeChatId) return;
    try {
        await fetch(`${BACKEND_URL}/api/messages`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ chat_id: activeChatId, text: '📷 Photo', image: base64Image })
        });
    } catch(e) {}
}

function initRealtime() {
    if(!window.socket) return;
    window.socket.on('global_message_update', async () => {
        await fetchGroups();
        renderGroupsList();
        renderCommunitiesList();
        renderChatsList();
    });
    
    window.socket.on('receive_message', (newMsg) => {
        const chat = [...chatsData, ...groupsData, ...communitiesData].find(c => c.id === newMsg.chat_id);
        if (chat) {
            if (!chat.messages) chat.messages = [];
            if (!chat.messages.find(m => m.id === newMsg.id)) {
                chat.messages.push({
                    id: newMsg.id,
                    senderId: newMsg.sender_id,
                    text: newMsg.text,
                    image: newMsg.image,
                    timestamp: new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                if (activeChatId === newMsg.chat_id) {
                    renderMessages(chat);
                }
            }
        }
    });
}
"""

content += new_funcs

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully refactored app.js")
