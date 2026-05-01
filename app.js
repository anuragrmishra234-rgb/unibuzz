// Mock Database (Now Dynamic)
const BACKEND_URL = 'https://unibuzz-bd9g.onrender.com';
let currentUser = {
    id: '',
    name: '',
    avatar: '',
    role: 'student'
};

let users = {
    'u1': { id: 'u1', name: 'Aryan Malhotra', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan', bio: 'Coding my way through life. 💻', isDummy: true },
    'u2': { id: 'u2', name: 'Ishani Gupta', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishani', bio: 'Coding my way through life. 💻', isDummy: true },
    'u3': { id: 'u3', name: 'Aarav Sharma', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav', bio: 'Coffee, Code, and Cricket. 🏏', isDummy: true },
    'u4': { id: 'u4', name: 'Ananya Iyer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', bio: 'Design is my passion. ✨', isDummy: true },
    'u5': { id: 'u5', name: 'Vikram Singh', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram', bio: 'Always up for a trek. 🏔️', isDummy: true },
    'u6': { id: 'u6', name: 'Sana Khan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sana', bio: 'Photography enthusiast. 📸', isDummy: true },
    'u7': { id: 'u7', name: 'Rahul Reddy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', bio: 'Startup dreamer. 🚀', isDummy: true }
};

function getDisplayName(userId) {
    if (userId === 'system') return 'System';
    const u = userId === currentUser.id ? currentUser : users[userId];
    if (u) {
        if (u.name && u.name.trim() !== '') return u.name;
        if (u.phone && u.phone.trim() !== '') return u.phone;
        if (u.email && u.email.trim() !== '') return u.email.split('@')[0];
    }
    // Fallback if userId is an email
    if (userId && userId.includes('@')) return userId.split('@')[0];
    return 'Student';
}

let chatsData = [];
let groupsData = [];
let communitiesData = [];

const lostFoundData = [];

// App State
let currentTab = 'chats'; // chats, groups, communities, lost-found
let activeChatId = null;
let activeLFId = null;
let isDarkTheme = false;
let lfSelectedImage = null; // Store base64 image
let currentSupabaseSubscription = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
const loginForm = document.getElementById('login-form');

const panelTitle = document.getElementById('panel-title');
const addNewBtn = document.getElementById('add-new-btn');

const chatsListUI = document.getElementById('chats-list');
const groupsListUI = document.getElementById('groups-list');
const communitiesListUI = document.getElementById('communities-list');
const lostFoundListUI = document.getElementById('lost-found-list');
const lfItemsListUI = document.getElementById('lf-items-list');
const lfPostBtn = document.getElementById('lf-post-btn');

const emptyState = document.getElementById('empty-state');
const chatView = document.getElementById('chat-view');
const lfView = document.getElementById('lf-view');

// Chat UI
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendMsgBtn = document.getElementById('send-msg-btn');
const chatTitle = document.getElementById('current-chat-name');
const chatAvatar = document.getElementById('current-chat-avatar');
const chatStatus = document.getElementById('current-chat-status');
const groupInfoBtn = document.getElementById('group-info-btn');

// Group Info Sidebar
const groupInfoSidebar = document.getElementById('group-info-sidebar');
const closeInfoBtn = document.getElementById('close-info-btn');

// Modals
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtns = document.querySelectorAll('.close-modal');

// New Interactive UI
const emojiBtn = document.getElementById('emoji-btn');
const emojiPicker = document.getElementById('emoji-picker');
const attachBtn = document.getElementById('attach-btn');
const chatFileInput = document.getElementById('chat-file-input');
const chatHeaderInfo = document.getElementById('chat-header-info');

const profileTriggers = document.querySelectorAll('.profile-trigger, #profile-trigger');
const profileSidebar = document.getElementById('profile-sidebar');
const closeProfileBtn = document.getElementById('close-profile-btn');
const profileImgContainer = document.getElementById('profile-img-container');
const profileUpload = document.getElementById('profile-upload');
const profileSidebarImg = document.getElementById('profile-sidebar-img');
const profileNameInput = document.getElementById('profile-name-input');
const profileBioInput = document.getElementById('profile-bio-input');
const saveProfileBtn = document.getElementById('save-profile-btn');
const navProfileImg = document.querySelector('.profile-trigger img, #profile-trigger');
const navItems = document.querySelectorAll('.nav-top .nav-item[data-tab]');

// Settings Sub-views
const backToSettings = document.getElementById('back-to-settings');
const settingsViewTitle = document.getElementById('settings-view-title');
const mainSettingsView = document.getElementById('main-settings-view');
const accountSettingsView = document.getElementById('account-settings-view');
// archivedSettingsView now lives inside the main chat sidebar (inline, not a modal)
const settingsSearchRow = document.getElementById('settings-search-row');

const accountImgEdit = document.getElementById('account-img-edit');
const accountEmailEdit = document.getElementById('account-email-edit');
const accountPhoneEdit = document.getElementById('account-phone-edit');
const mentionPopup = document.getElementById('mention-popup');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    window.socket = io(BACKEND_URL);

    // 1. Splash Screen Removal (Safeguard)
        const removeSplash = () => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => splash.classList.add('hidden'), 600);
        }
    };

    try {
        // PWA Service Worker Registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(e => console.error(e));
        }

        // --- Custom Wallpaper Support ---
        window.applyWallpaper = () => {
            const savedWP = localStorage.getItem('custom_wallpaper');
            const msgsArea = document.querySelector('.messages-area');
            if (msgsArea) {
                if (savedWP) {
                    msgsArea.style.backgroundImage = `url(${savedWP})`;
                    msgsArea.style.backgroundSize = 'cover';
                    msgsArea.style.backgroundPosition = 'center';
                } else {
                    msgsArea.style.backgroundImage = 'none';
                }
            }
        };
        window.applyWallpaper();

        // --- Message Draft Persistence ---
        const saveDraft = () => {
            if (activeChatId && messageInput.value) {
                localStorage.setItem(`draft_${activeChatId}`, messageInput.value);
            } else if (activeChatId) {
                localStorage.removeItem(`draft_${activeChatId}`);
            }
        };
        messageInput?.addEventListener('input', saveDraft);

        const loadDraft = (chatId) => {
            messageInput.value = localStorage.getItem(`draft_${chatId}`) || '';
        };



        // --- Session Persistence & Splash Setup ---
        let isAuthenticated = false;

        const finalizeAuth = () => {
            if (isAuthenticated) {
                loginScreen.classList.add('hidden');
                appScreen.classList.remove('hidden');
                initApp();
            } else {
                loginScreen.classList.remove('hidden');
            }
            removeSplash();
        };

        const handleSession = async (session) => {
            const lastUserStr = localStorage.getItem('last_user');
            const lastUser = lastUserStr ? JSON.parse(lastUserStr) : null;

            if (session) {
                isAuthenticated = true;
                currentUser.id = session.user.id;
                currentUser.email = session.user.email;
                currentUser.name = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                currentUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`;
                localStorage.setItem('unibuzz_session', JSON.stringify(currentUser));
                localStorage.setItem('last_user', JSON.stringify({ name: currentUser.name, avatar: currentUser.avatar, email: currentUser.email }));

                const avatars = document.querySelectorAll('.profile-trigger img, #profile-trigger');
                avatars.forEach(img => { if (img.tagName === 'IMG') img.src = currentUser.avatar; });
                document.getElementById('profile-display-name').textContent = currentUser.name;
                await syncUserProfile();
            } else {
                const saved = localStorage.getItem('unibuzz_session');
                if (saved) {
                    Object.assign(currentUser, JSON.parse(saved));
                    isAuthenticated = true;
                } else if (lastUser) {
                    // Show "Continue as" dashboard of signing in
                    const card = document.getElementById('continue-card');
                    if (card) {
                        card.classList.remove('hidden');
                        document.getElementById('prev-user-avatar').src = lastUser.avatar;
                        document.getElementById('prev-user-name').textContent = lastUser.name;
                        document.getElementById('email').value = lastUser.email;
                        card.onclick = () => {
                            if (loginDashboard) loginDashboard.classList.add('hidden');
                            loginForm.classList.remove('hidden');
                            document.getElementById('password').focus();
                        };
                    }
                }
            }
            // Auto-login to dashboard if session exists
            if (isAuthenticated) {
                finalizeAuth();
            } else {
                setTimeout(finalizeAuth, 500); // Snappier feel
            }
        };

        const token = localStorage.getItem('unibuzz_token');
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
        }

        // --- Auth Setup ---
        const loginDashboard = document.getElementById('login-dashboard');
        const showLoginBtn = document.getElementById('show-login-btn');
        const backToDashboardBtn = document.getElementById('back-to-dashboard');
        const guestLoginBtn = document.getElementById('guest-login-btn');

        let isSignUpMode = false;
        const authSubtitle = document.getElementById('auth-subtitle');
        const nameGroup = document.getElementById('name-group');
        const phoneGroup = document.getElementById('phone-group');
        const authNameInput = document.getElementById('auth-name');
        const authPhoneInput = document.getElementById('auth-phone');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const authToggleText = document.getElementById('auth-toggle-text');
        const authToggleBtn = document.getElementById('auth-toggle-btn');

        showLoginBtn?.addEventListener('click', () => {
            if (loginDashboard) loginDashboard.classList.add('hidden');
            loginForm.classList.remove('hidden');
            if (emailInput) emailInput.focus();
        });

        backToDashboardBtn?.addEventListener('click', () => {
            loginForm.classList.add('hidden');
            if (loginDashboard) loginDashboard.classList.remove('hidden');
        });

        guestLoginBtn?.addEventListener('click', () => {
            const saved = localStorage.getItem('unibuzz_session');
            const savedUser = saved ? JSON.parse(saved) : null;
            
            if (savedUser && savedUser.id && savedUser.id.startsWith('guest_')) {
                // Reuse existing guest identity
                Object.assign(currentUser, savedUser);
            } else {
                // Create new guest identity
                const guestId = 'guest_' + Math.floor(Math.random() * 1000000);
                currentUser.id = guestId;
                currentUser.name = 'Guest User';
                currentUser.email = `guest_${guestId}@unibuzz.app`;
                currentUser.avatar = `https://ui-avatars.com/api/?name=Guest+User&background=random`;
            }
            
            isAuthenticated = true;
            localStorage.setItem('unibuzz_session', JSON.stringify(currentUser));
            finalizeAuth();
        });

        authToggleBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            isSignUpMode = !isSignUpMode;

            // Ensure form is visible if coming from dashboard
            if (loginDashboard) loginDashboard.classList.add('hidden');
            loginForm.classList.remove('hidden');

            if (isSignUpMode) {
                authSubtitle.textContent = "Create a new account to join!";
                nameGroup.classList.remove('hidden');
                phoneGroup.classList.remove('hidden');
                authSubmitBtn.textContent = 'Sign Up';
                authToggleText.textContent = "Already have an account?";
                authToggleBtn.textContent = "Log In";
            } else {
                authSubtitle.textContent = "Chat, Connect and Find what's yours!";
                nameGroup.classList.add('hidden');
                phoneGroup.classList.add('hidden');
                authSubmitBtn.textContent = 'Log In';
                authToggleText.textContent = "Don't have an account?";
                authToggleBtn.textContent = "Sign Up";
            }
        });

        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            authSubmitBtn.disabled = true;

            try {
                let data, error;
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
                }

                if (error) {
                    alert(error.message || "Authentication failed");
                } else {
                    const user = data.user || data;
                    if (user) {
                        currentUser.id = user.id;
                        currentUser.email = user.email || email;
                        currentUser.name = user.user_metadata?.full_name || email.split('@')[0];
                        currentUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=random`;
                        localStorage.setItem('unibuzz_session', JSON.stringify(currentUser));
                    }
                    
                    await syncUserProfile();

                    loginScreen.classList.add('hidden');
                    appScreen.classList.remove('hidden');
                    initApp();
                }
            } catch (err) {
                 alert("Authentication error: " + err.message);
            }
            authSubmitBtn.disabled = false;
        });

        // --- Tagging (@Mentions) Support ---
        const handleMentions = (e) => {
            const text = messageInput.value;
            const cursor = messageInput.selectionStart;
            const lastAt = text.lastIndexOf('@', cursor - 1);

            if (lastAt !== -1 && !text.substring(lastAt, cursor).includes(' ')) {
                const query = text.substring(lastAt + 1, cursor).toLowerCase();
                const list = [...groupsData, ...communitiesData, ...chatsData];
                const activeChat = list.find(c => c.id === activeChatId);

                if (activeChat && activeChat.members) {
                    const members = activeChat.members.filter(m => {
                        const mName = getDisplayName(m).toLowerCase();
                        return mName.includes(query) && m !== currentUser.id;
                    });

                    if (members.length > 0) {
                        mentionPopup.innerHTML = '';
                        members.forEach(mId => {
                            const mName = getDisplayName(mId);
                            const mAvatar = users[mId]?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mName)}`;
                            const div = document.createElement('div');
                            div.className = 'p-3 flex items-center gap-3 cursor-pointer hover-bg';
                            div.style.cssText = 'border-bottom: 1px solid rgba(255,255,255,0.05);';
                            div.innerHTML = `
                                <img src="${mAvatar}" class="avatar avatar-xs">
                                <span class="text-sm font-bold">${mName}</span>
                            `;
                            div.onclick = () => {
                                const before = text.substring(0, lastAt);
                                const after = text.substring(cursor);
                                messageInput.value = before + '@' + mName + ' ' + after;
                                mentionPopup.classList.add('hidden');
                                messageInput.focus();
                                saveDraft();
                            };
                            mentionPopup.appendChild(div);
                        });
                        mentionPopup.classList.remove('hidden');
                    } else {
                        mentionPopup.classList.add('hidden');
                    }
                } else {
                    mentionPopup.classList.add('hidden');
                }
            } else {
                mentionPopup.classList.add('hidden');
            }
        };
        messageInput?.addEventListener('input', handleMentions);
        messageInput?.addEventListener('click', () => mentionPopup.classList.add('hidden'));

        // Navigation Tabs (Listeners only)
        document.querySelectorAll('.nav-top .nav-item[data-tab]').forEach(item => {
            item.addEventListener('click', () => switchTab(item.getAttribute('data-tab')));
        });

        // Settings Nav
        document.getElementById('settings-nav-btn')?.addEventListener('click', () => {
            profileSidebar.classList.remove('hidden');
            openSettingsView('main');
        });

        // Modals & Chat
        document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
        addNewBtn?.addEventListener('click', handleAddNewAction);
        lfPostBtn?.addEventListener('click', handleAddNewAction);
        sendMsgBtn?.addEventListener('click', sendMessage);
        messageInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

        // Theme Toggle Support
        const themeToggleBtn = document.getElementById('theme-toggle');
        themeToggleBtn?.addEventListener('click', () => {
            const body = document.body;
            const currentTheme = body.getAttribute('data-theme');
            let nextTheme = '';

            if (currentTheme === 'light') {
                nextTheme = 'dark';
                themeToggleBtn.querySelector('i').className = 'ph ph-sun';
            } else if (currentTheme === 'dark') {
                nextTheme = 'light';
                themeToggleBtn.querySelector('i').className = 'ph ph-moon';
            } else {
                // Default is dark-ish, so go light
                nextTheme = 'light';
                themeToggleBtn.querySelector('i').className = 'ph ph-moon';
            }

            body.setAttribute('data-theme', nextTheme);
            localStorage.setItem('unibuzz_theme', nextTheme);
        });

        // Initialize theme from storage
        const savedTheme = localStorage.getItem('unibuzz_theme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
        if (themeToggleBtn) {
            themeToggleBtn.querySelector('i').className = savedTheme === 'light' ? 'ph ph-sun' : 'ph ph-moon';
        }

        // Sidebar Actions
        groupInfoBtn?.addEventListener('click', () => {
            groupInfoSidebar.classList.remove('hidden');
            populateGroupInfo();
        });
        closeInfoBtn?.addEventListener('click', () => groupInfoSidebar.classList.add('hidden'));

        emojiBtn?.addEventListener('click', () => {
            emojiPicker.classList.toggle('hidden');
            if (!emojiPicker.classList.contains('hidden')) {
                renderEmojiGrid('smileys');
            }
        });

        // Initialize Emoji Tabs
        document.querySelectorAll('.emoji-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.emoji-tab').forEach(t => t.style.opacity = '0.5');
                tab.style.opacity = '1';
                const cat = tab.getAttribute('data-cat');
                if (cat === 'gifs') {
                    renderGifGrid();
                } else {
                    renderEmojiGrid(cat);
                }
            });
        });

        attachBtn?.addEventListener('click', () => chatFileInput.click());
        chatFileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => sendAttachment(evt.target.result);
                reader.readAsDataURL(file);
            }
        });

        // Profile Sidebar Interactions (Unified)
        const profileTags = document.querySelectorAll('.profile-trigger');
        profileTags.forEach(trigger => {
            trigger.addEventListener('click', () => {
                profileSidebar.classList.remove('hidden');
                openSettingsView('account');
            });
        });

        // Chat Header Click (WhatsApp-style)
        chatHeaderInfo?.addEventListener('click', () => {
            if (activeChatId && (activeChatId.startsWith('g') || activeChatId.startsWith('cm') || activeChatId.length > 5)) {
                // If it's a group, community, or supabase chat, show info
                const list = [...groupsData, ...communitiesData];
                const group = list.find(g => g.id === activeChatId);
                if (group) {
                    groupInfoSidebar.classList.remove('hidden');
                    populateGroupInfo();
                }
            }
        });

        // Leave Group Support
        document.getElementById('leave-group-btn')?.addEventListener('click', leaveGroup);

        // Menu Listeners
        // Menu dropdown is handled via HTML triggered by .dropdown-trigger
        // but let's ensure the dropdown content stays visible if clicked inside
        document.querySelectorAll('.dropdown-trigger').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const content = btn.nextElementSibling;
                if (content) content.style.display = content.style.display === 'block' ? 'none' : 'block';
                e.stopPropagation();
            });
        });
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-content').forEach(d => d.style.display = 'none');
        });

        const autoSaveProfile = async () => {
            currentUser.name = profileNameInput.value.trim();
            currentUser.bio = profileBioInput.value.trim();
            currentUser.phone = accountPhoneEdit.value.trim();
            currentUser.avatar = accountImgEdit.src;

            // Update UI
            document.querySelectorAll('#profile-display-name').forEach(el => el.textContent = currentUser.name);
            const avatars = document.querySelectorAll('.profile-trigger img, #profile-sidebar-img, #account-img-edit');
            avatars.forEach(img => { if (img.tagName === 'IMG') img.src = currentUser.avatar; });

            if (window.supabaseClient && currentUser.id) {
                await syncUserProfile();
            }
            localStorage.setItem('unibuzz_session', JSON.stringify(currentUser));
            console.log("Autosaved vibe settings... ✨");
        };

        // Enable Autosave on input change
        [profileNameInput, profileBioInput, accountPhoneEdit].forEach(el => {
            el?.addEventListener('blur', autoSaveProfile);
        });

        saveProfileBtn?.addEventListener('click', async () => {
            await autoSaveProfile();
            openSettingsView('main');
            alert("Vibe check passed! Profile updated. ✨");
        });

        document.getElementById('profile-upload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    accountImgEdit.src = evt.target.result;
                    const sideImg = document.getElementById('profile-sidebar-img');
                    if (sideImg) sideImg.src = evt.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Wallpaper Upload logic
        document.getElementById('wp-upload-input')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    localStorage.setItem('custom_wallpaper', evt.target.result);
                    alert("Chat backdrop set! ✨");
                    applyWallpaper();
                };
                reader.readAsDataURL(file);
            }
        });

        backToSettings?.addEventListener('click', () => openSettingsView('main'));
        document.getElementById('close-profile-btn')?.addEventListener('click', () => profileSidebar.classList.add('hidden'));

        // Account Settings Save
        document.getElementById('save-account-btn')?.addEventListener('click', async (e) => {
            e.preventDefault();
            const newEmail = document.getElementById('account-email').value;
            const newPhone = document.getElementById('account-phone').value;
            if (newEmail) {
                currentUser.email = newEmail;
                currentUser.phone = newPhone;
                if (window.supabaseClient) {
                    await syncUserProfile();
                }
                alert("Account updated!");
                document.getElementById('account-modal').classList.add('hidden');
            }
        });

        // Wire up Search
        const searchInput = document.getElementById('global-search');
        searchInput?.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.list-item').forEach(item => {
                const title = item.querySelector('.item-title')?.textContent.toLowerCase() || "";
                item.style.display = title.includes(term) ? 'flex' : 'none';
            });
        });

        // Global Icon Pulse Effect
        document.querySelectorAll('.icon-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.add('pulse-animation');
                setTimeout(() => btn.classList.remove('pulse-animation'), 300);
            });
        });

        // Announcement Logic
        const announceBtn = document.getElementById('announce-btn');
        announceBtn?.addEventListener('click', () => {
            const isAnnouncing = announceBtn.classList.toggle('active');
            announceBtn.style.color = isAnnouncing ? 'var(--success)' : 'var(--text-muted)';
            messageInput.placeholder = isAnnouncing ? "Post global announcement..." : "Type a message";
        });

    } catch (err) {
        console.error("App initialization failed:", err);
        removeSplash(); // Still hide splash so user can see what's wrong
    }
});

async function initApp() {
    await fetchProfiles();
    await fetchGroups();
    await fetchListings();
    initRealtime();
    renderChatsList();
    renderGroupsList();
    renderCommunitiesList();
    renderLFList();
    switchTab('chats');
}

async function syncUserProfile() {
    if (!currentUser.id || currentUser.id.length < 5) return;
    try {
        const profileData = {
            id: currentUser.id,
            name: currentUser.name || '',
            avatar: currentUser.avatar || '',
            email: currentUser.email || '',
            updated_at: new Date()
        };
        // Only add bio/phone if they are defined to avoid potential schema errors
        if (currentUser.bio) profileData.bio = currentUser.bio;
        if (currentUser.phone) profileData.phone = currentUser.phone;

        if (window.supabaseClient) {
            const { error } = await window.supabaseClient.from('profiles').upsert(profileData);
            if (error) console.warn("Profile Sync Warning:", error);
        }
    } catch (err) {
        console.error("Critical Profile Sync Error:", err);
    }
}

window.openSettingsView = function (view) {
    mainSettingsView.classList.add('hidden');
    accountSettingsView.classList.add('hidden');
    backToSettings.classList.remove('hidden');
    settingsSearchRow.classList.add('hidden');

    if (view === 'main') {
        mainSettingsView.classList.remove('hidden');
        backToSettings.classList.add('hidden');
        settingsViewTitle.textContent = "Settings";
        settingsSearchRow.classList.remove('hidden');
    } else if (view === 'account') {
        accountSettingsView.classList.remove('hidden');
        settingsViewTitle.textContent = "Account";
        profileNameInput.value = currentUser.name || '';
        profileBioInput.value = currentUser.bio || '';
        accountEmailEdit.value = currentUser.email || '';
        accountPhoneEdit.value = currentUser.phone || '';
        if (accountImgEdit) accountImgEdit.src = currentUser.avatar || '';
    }
};

window.unarchiveFromSidebar = function (id) {
    const chat = chatsData.find(c => c.id === id);
    if (chat) {
        chat.archived = false;
        chat.isArchived = false;
        renderChatsList();
        alert("Restored to chats! 📂");
    }
};

async function fetchProfiles() {
    const { data, error } = await window.supabaseClient.from('profiles').select('*');
    if (!error && data) {
        data.forEach(p => {
            users[p.id] = { id: p.id, name: p.name, avatar: p.avatar, bio: p.bio, phone: p.phone, email: p.email || p.id };
            if (p.id === currentUser.id) {
                currentUser.name = p.name;
                currentUser.avatar = p.avatar;
                currentUser.bio = p.bio;
                currentUser.phone = p.phone;
                document.getElementById('profile-display-name').textContent = p.name;
                document.getElementById('profile-sidebar-img').src = p.avatar;
            }
        });
    }
}

async function fetchGroups() {
    // 1. Fetch Groups
    if (!window.supabaseClient) return;
    const { data: groups, error: gError } = await window.supabaseClient.from('groups').select('*');
    if (gError) return;

    // 2. Fetch Members for each group
    const { data: members, error: mError } = await window.supabaseClient.from('group_members').select('*');

    if (!mError && members) {
        // Fetch All Messages to populate sidebar snippets
        const { data: allMessages, error: msgError } = await window.supabaseClient.from('messages').select('*').order('created_at', { ascending: true });

        groups.forEach(g => {
            g.members = members.filter(m => m.group_id === g.id).map(m => m.user_id);
            g.admins = members.filter(m => m.group_id === g.id && m.is_admin).map(m => m.user_id);

            const groupMsgs = allMessages ? allMessages.filter(msg => msg.chat_id === g.id) : [];
            g.messages = groupMsgs.length > 0 ? groupMsgs.map(row => ({
                id: row.id,
                senderId: row.sender_id,
                text: row.text,
                timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })) : [{ senderId: 'system', text: 'Welcome!', timestamp: '' }];
        });
    }

    groupsData = [...groups.filter(g => g.type === 'group')];
    communitiesData = [...groups.filter(g => g.type === 'community')];

    const dbChats = groups.map(g => {
        if (g.type === 'direct') {
            g.participants = g.members;
            if (g.members) {
                const otherUserId = g.members.find(id => id !== currentUser.id);
                if (otherUserId && users[otherUserId]) {
                    g.topic = users[otherUserId].name;
                    g.avatar = users[otherUserId].avatar;
                } else if (!otherUserId) {
                    // Chat with self
                    g.topic = currentUser.name + " (You)";
                    g.avatar = currentUser.avatar;
                } else {
                    g.topic = "User";
                }
            }
        }
        return g;
    });

    // Merge DB chats with dummy chats (Avoid duplicates)
    dbChats.forEach(dbC => {
        if (!chatsData.find(d => d.id === dbC.id)) chatsData.push(dbC);
    });
}

// 3. Central Real-time Subscriptions (Call once)
function initRealtime() {
    if (!window.supabaseClient) return;

    window.supabaseClient
        .channel('public:groups')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'groups' }, async () => {
            await fetchGroups();
            renderGroupsList();
            renderCommunitiesList();
            renderChatsList();
        })
        .subscribe();

    window.supabaseClient
        .channel('public:group_members')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, async () => {
            await fetchGroups();
            if (activeChatId) {
                const group = [...groupsData, ...communitiesData, ...chatsData].find(g => g.id === activeChatId);
                if (group) {
                    chatStatus.textContent = group.type === 'direct' ? 'Online' : `${group.members.length} members`;
                    if (!groupInfoSidebar.classList.contains('hidden')) populateGroupInfo();
                    if (typeof updateJoinStatusUI === 'function') updateJoinStatusUI(group);
                }
            }
            renderGroupsList();
            renderCommunitiesList();
            renderChatsList();
        })
        .subscribe();

    window.supabaseClient
        .channel('public:listings')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, payload => {
            const item = payload.new;
            const newItem = {
                id: item.id,
                title: item.title,
                type: item.type,
                description: item.description,
                author: item.author_id,
                timestamp: new Date(item.created_at).toLocaleDateString(),
                image: item.image_url,
                contact: item.contact
            };
            if (!lostFoundData.find(i => i.id === newItem.id)) {
                lostFoundData.unshift(newItem);
                renderLFList();
            }
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listings' }, payload => {
            const deletedId = payload.old.id;
            const index = lostFoundData.findIndex(i => i.id === deletedId);
            if (index !== -1) {
                lostFoundData.splice(index, 1);
                renderLFList();
                if (activeLFId === deletedId) switchTab('lost-found');
            }
        })
        .subscribe();

    // Global Message Listener for Sidebar updates
    window.supabaseClient
        .channel('public:messages_global')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const newMsg = payload.new;
            const chat = [...chatsData, ...groupsData, ...communitiesData].find(c => c.id === newMsg.chat_id);
            if (chat) {
                if (!chat.messages) chat.messages = [];
                if (!chat.messages.find(m => m.id === newMsg.id)) {
                    chat.messages.push({
                        id: newMsg.id,
                        senderId: newMsg.sender_id,
                        text: newMsg.text,
                        timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                    // Re-render only if the sidebar is relevant
                    renderChatsList();
                    renderGroupsList();
                    renderCommunitiesList();
                }
            }
        })
        .subscribe();
}

async function fetchListings() {
    if (!window.supabaseClient) return;
    try {
        const { data, error } = await window.supabaseClient.from('listings').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            lostFoundData.length = 0;
            data.forEach(item => {
                lostFoundData.push({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    description: item.description,
                    author: item.author_id,
                    timestamp: new Date(item.created_at).toLocaleDateString(),
                    image: item.image_url,
                    contact: item.contact
                });
            });
        }
    } catch (e) {
        console.error("Fetch listings failed:", e);
    }
}

// --- Navigation & Routing ---
function switchTab(tabId) {
    currentTab = tabId;
    activeChatId = null;
    activeLFId = null;

    // Update Nav UI
    const navItemsUI = document.querySelectorAll('.nav-top .nav-item[data-tab]');
    navItemsUI.forEach(item => item.classList.remove('active'));
    const activeNavItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeNavItem) activeNavItem.classList.add('active');

    // Update Panel UI
    [chatsListUI, groupsListUI, communitiesListUI, lostFoundListUI].forEach(el => el.classList.add('hidden'));

    // Update Main View
    chatView.classList.add('hidden');
    lfView.classList.add('hidden');
    emptyState.classList.remove('hidden');
    groupInfoSidebar.classList.add('hidden');

    if (tabId === 'chats') {
        panelTitle.textContent = 'Chats';
        chatsListUI.classList.remove('hidden');
    } else if (tabId === 'groups') {
        panelTitle.textContent = 'Groups';
        groupsListUI.classList.remove('hidden');
    } else if (tabId === 'communities') {
        panelTitle.textContent = 'Communities';
        communitiesListUI.classList.remove('hidden');
    } else if (tabId === 'lost-found') {
        panelTitle.textContent = 'Lost & Found';
        lostFoundListUI.classList.remove('hidden');
    }
} // end switchTab

// --- Render Lists ---
let showArchived = false;
let currentFilter = null; // 'starred', 'muted', 'groups', null


function renderChatsList() {
    chatsListUI.innerHTML = '';

    // Check if any sub-vaults are needed
    const archivedCount = chatsData.filter(c => c.archived || c.isArchived).length;
    const starredCount = chatsData.filter(c => c.starred && !(c.archived || c.isArchived)).length;
    const mutedCount = chatsData.filter(c => c.muted && !(c.archived || c.isArchived)).length;
    const groupsCount = chatsData.filter(c => c.type === 'group' && !(c.archived || c.isArchived)).length;

    // Filter Navigation (Vaults) — shown as a 2-column grid
    if (!currentFilter && !showArchived) {
        const vaultEntries = [
            archivedCount > 0 ? { label: 'Archived', icon: 'ph-archive', count: archivedCount, type: 'archived' } : null,
            starredCount > 0 ? { label: 'Starred', icon: 'ph-star-fill', count: starredCount, type: 'starred' } : null,
            mutedCount > 0 ? { label: 'Muted', icon: 'ph-bell-slash', count: mutedCount, type: 'muted' } : null,
            groupsCount > 0 ? { label: 'Groups', icon: 'ph-users', count: groupsCount, type: 'groups' } : null,
        ].filter(Boolean);

        if (vaultEntries.length > 0) {
            const gridWrapper = document.createElement('div');
            gridWrapper.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:8px 12px 12px; margin-bottom:4px;';

            vaultEntries.forEach(v => {
                const card = document.createElement('div');
                card.style.cssText = 'background:rgba(255,255,255,0.04); border-radius:14px; padding:14px 10px; cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:6px; transition:background 0.2s;';
                card.innerHTML = `
                    <div style="width:36px;height:36px;background:var(--accent-primary);border-radius:10px;display:flex;align-items:center;justify-content:center;">
                        <i class="ph-fill ${v.icon}" style="font-size:18px;color:#000;"></i>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:12px;font-weight:700;color:var(--text-main);">${v.label}</div>
                        <div style="font-size:10px;color:var(--text-muted);">${v.count} buzz${v.count !== 1 ? 'es' : ''}</div>
                    </div>
                `;
                card.addEventListener('mouseenter', () => card.style.background = 'rgba(255,255,255,0.08)');
                card.addEventListener('mouseleave', () => card.style.background = 'rgba(255,255,255,0.04)');
                card.onclick = () => { if (v.type === 'archived') showArchived = true; else currentFilter = v.type; renderChatsList(); };
                gridWrapper.appendChild(card);
            });

            chatsListUI.appendChild(gridWrapper);

            const divider = document.createElement('div');
            divider.style.cssText = 'height:1px;background:rgba(255,255,255,0.05);margin:0 12px 10px;';
            chatsListUI.appendChild(divider);
        }
    }

    if (showArchived || currentFilter) {
        const backBtn = document.createElement('li');
        backBtn.className = 'list-item hover-bg mb-4';
        backBtn.innerHTML = `<i class="ph ph-arrow-left mr-3"></i> <span class="font-bold">Back to All Buzz</span>`;
        backBtn.onclick = () => { showArchived = false; currentFilter = null; renderChatsList(); };
        chatsListUI.appendChild(backBtn);
        panelTitle.textContent = currentFilter ? currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1) : "Archived Vault";
    } else {
        panelTitle.textContent = "Chats";
    }

    const userChats = chatsData.filter(chat => {
        const isParticipant = (chat.participants?.includes(currentUser.id) || chat.members?.includes(currentUser.id));
        if (!isParticipant) return false;

        const isArchived = chat.archived || chat.isArchived;

        if (showArchived) return isArchived;
        if (isArchived) return false; // Hide archived in all other views

        if (currentFilter === 'starred') return chat.starred;
        if (currentFilter === 'muted') return chat.muted;
        if (currentFilter === 'groups') return chat.type === 'group';

        return true;
    });

    if (userChats.length === 0) {
        chatsListUI.innerHTML += `<div class="p-10 text-center text-dimmed text-sm"><i class="ph ph-backpack-fill text-2xl mb-2 opacity-20"></i><br>Empty in this vault.</div>`;
    }

    userChats.forEach(chat => {
        const lastMsg = chat.messages?.[chat.messages.length - 1] || { senderId: 'system', text: 'No messages yet', timestamp: '' };
        const lastSender = lastMsg.senderId === currentUser.id ? 'You' : (users[lastMsg.senderId]?.name?.split(' ')[0] || 'User');
        const li = document.createElement('li');
        li.className = `list-item ${activeChatId === chat.id ? 'selected' : ''}`;
        li.setAttribute('data-chat-id', chat.id);
        li.innerHTML = `
            <img src="${chat.avatar}" class="avatar avatar-sm" alt="">
            <div class="item-content">
                <div class="item-header">
                    <span class="item-title">${chat.topic}</span>
                    <span class="item-time">${lastMsg.timestamp}</span>
                </div>
                <div class="item-subtitle" style="display:flex; justify-content:space-between;">
                    <span style="overflow:hidden; text-overflow:ellipsis;">${lastSender}: ${lastMsg.text}</span>
                    <div style="display:flex; gap:6px; align-items:center;">
                        ${showArchived ? `<button class="icon-btn text-xs bg-accent-primary p-1" style="background:var(--accent-primary); border-radius:4px; color:black;" onclick="event.stopPropagation(); unarchiveFromSidebar('${chat.id}')"><i class="ph ph-folder-open"></i></button>` : ''}
                        ${chat.muted ? '<i class="ph ph-bell-slash text-xs"></i>' : ''}
                        ${chat.starred ? '<i class="ph ph-star-fill text-warning text-xs"></i>' : ''}
                        ${chat.unread ? `<span class="badge">${chat.unread}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
        li.addEventListener('click', () => openChat(chat, li));
        chatsListUI.appendChild(li);
    });
}

function appendVault(label, icon, count, type) {
    const li = document.createElement('li');
    li.className = 'list-item hover-bg p-3 mb-1';
    li.style.borderRadius = '14px';
    li.style.background = 'rgba(255, 255, 255, 0.02)';
    li.innerHTML = `
        <div class="avatar avatar-sm flex items-center justify-center" style="background:var(--accent-primary); color:black; border-radius:10px;"><i class="ph-fill ${icon}"></i></div>
        <div class="item-content ml-3">
            <div class="item-title font-bold text-sm" style="color:var(--text-main);">${label}</div>
            <div class="text-xs text-dimmed">${count} buzzes</div>
        </div>
        <i class="ph ph-caret-right text-dimmed text-xs"></i>
    `;
    li.onclick = () => { if (type === 'archived') showArchived = true; else currentFilter = type; renderChatsList(); };
    chatsListUI.appendChild(li);
}

function renderGroupsList() {
    groupsListUI.innerHTML = '';
    // Show all groups, but maybe mark joined ones
    groupsData.forEach(group => {
        const lastMsg = group.messages[group.messages.length - 1];
        const lastSender = lastMsg ? (lastMsg.senderId === currentUser.id ? 'You' : (users[lastMsg.senderId]?.name || 'User')) : '';
        const isJoined = group.members.includes(currentUser.id);

        const li = document.createElement('li');
        li.className = `list-item ${activeChatId === group.id ? 'selected' : ''}`;
        li.innerHTML = `
            <img src="${group.avatar}" class="avatar avatar-md" alt="">
            <div class="item-content">
                <div class="item-header">
                    <span class="item-title">${group.topic}</span>
                    ${lastMsg ? `<span class="item-time">${lastMsg.timestamp}</span>` : ''}
                </div>
                <div class="item-subtitle">
                    ${!isJoined ? `<span class="text-accent-primary" style="color:var(--accent-primary)">Join this group</span>` :
                `${lastSender ? `<b>${lastSender.split(' ')[0]}:</b> ` : ''}${lastMsg ? lastMsg.text : 'No messages'}`}
                </div>
            </div>
        `;
        li.addEventListener('click', () => openChat(group, li));
        groupsListUI.appendChild(li);
    });
}

function renderCommunitiesList() {
    communitiesListUI.innerHTML = '';
    communitiesData.forEach(comm => {
        const lastMsg = comm.messages[comm.messages.length - 1];
        const lastSender = lastMsg && lastMsg.senderId === currentUser.id ? 'You' : (users[lastMsg.senderId]?.name || 'User');
        const isJoined = comm.members.includes(currentUser.id);

        const li = document.createElement('li');
        li.className = `list-item ${activeChatId === comm.id ? 'selected' : ''}`;
        li.innerHTML = `
            <img src="${comm.avatar}" class="avatar avatar-md" alt="">
            <div class="item-content">
                <div class="item-header">
                    <span class="item-title">${comm.topic}</span>
                    <span class="item-time">${lastMsg ? lastMsg.timestamp : ''}</span>
                </div>
                <div class="item-subtitle">
                    ${!isJoined ? `<span class="text-accent-primary" style="color:var(--success)">Join Community</span>` :
                `${lastSender ? `<b>${lastSender.split(' ')[0]}:</b> ` : ''}${lastMsg ? lastMsg.text : 'Welcome'}`}
                </div>
            </div>
        `;
        li.addEventListener('click', () => openChat(comm, li));
        communitiesListUI.appendChild(li);
    });
}

function renderLFList() {
    lfItemsListUI.innerHTML = '';

    // Update stats dynamically
    const lostCount = lostFoundData.filter(i => i.type === 'lost').length;
    const foundCount = lostFoundData.filter(i => i.type === 'found').length;
    const stats = lostFoundListUI.querySelectorAll('.stat-number');
    if (stats.length >= 2) {
        stats[0].textContent = lostCount;
        stats[1].textContent = foundCount;
    }

    lostFoundData.forEach(item => {
        const isAuthor = item.author === currentUser.id;
        const li = document.createElement('li');
        li.className = `lf-card`;
        li.innerHTML = `
            <div class="lf-header">
                <div class="flex items-center gap-2">
                    <div class="tag ${item.type === 'lost' ? 'tag-lost' : 'tag-found'}">${item.type.toUpperCase()}</div>
                    <span class="item-time" style="font-weight:600;">${item.timestamp}</span>
                </div>
                ${isAuthor ? `
                <button class="icon-btn text-danger delete-lf-btn" style="background:rgba(239, 68, 68, 0.1); border-radius:8px; padding:6px;" title="Delete listing">
                    <i class="ph ph-trash-fill" style="font-size:1.2rem;"></i>
                </button>` : ''}
            </div>
            <div class="lf-title">${item.title}</div>
            ${item.image ? `<img src="${item.image}" class="lf-img-thumb">` : ''}
            <div class="text-sm text-dimmed mb-2" style="font-weight:500;">${item.description.substring(0, 60)}...</div>
            
            ${!isAuthor ? `
            <button class="primary-btn w-full mt-2 flex items-center justify-center gap-2" style="background:linear-gradient(to right, var(--accent-primary), var(--accent-hover)); font-size:0.8rem; padding:0.5rem;" onclick="event.stopPropagation(); contactAuthor('${item.author}', '${encodeURIComponent(item.title)}')">
                <i class="ph-fill ph-chat-circle-dots"></i> Chat Now
            </button>` : ''}
        `;

        // Delete button listener
        const deleteBtn = li.querySelector('.delete-lf-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Don't open details
                deleteLFItem(item.id);
            });
        }

        li.addEventListener('click', () => openLFItem(item));
        lfItemsListUI.appendChild(li);
    });
}

// --- Main Views (Chat) ---
async function openChat(chat, listItemUi) {
    activeChatId = chat.id;
    activeLFId = null;

    document.querySelectorAll('.list-item').forEach(el => el.classList.remove('selected'));
    if (listItemUi) listItemUi.classList.add('selected');

    emptyState.classList.add('hidden');
    lfView.classList.add('hidden');
    chatView.classList.remove('hidden');

    if (chat.type === 'group' || chat.type === 'community') {
        groupInfoSidebar.classList.add('hidden');
        groupInfoBtn.style.display = 'block';
        chatStatus.textContent = `${chat.members.length} members`;
    } else {
        groupInfoSidebar.classList.add('hidden');
        groupInfoBtn.style.display = 'none';
        chatStatus.textContent = 'Online';
    }

    chatTitle.textContent = chat.topic;
    chatAvatar.src = chat.avatar;

    // Load draft if any
    if (typeof loadDraft === 'function') loadDraft(chat.id);

    // Show announcement button if user is admin
    const announceBtn = document.getElementById('announce-btn');
    if (announceBtn) {
        const isAdmin = chat.admins && chat.admins.includes(currentUser.id);
        if (isAdmin || chat.announcementOnly) {
            announceBtn.style.display = 'block';
        } else {
            announceBtn.style.display = 'none';
            announceBtn.classList.remove('active');
            messageInput.placeholder = "Type a message";
        }
    }

    // Check Membership
    updateJoinStatusUI(chat);

    // Fetch from Supabase
    if (window.supabaseClient) {
        messagesContainer.innerHTML = '<div class="text-center text-dimmed mt-4">Loading messages...</div>';

        // 1. Fetch existing
        const { data, error } = await window.supabaseClient
            .from('messages')
            .select('*')
            .eq('chat_id', activeChatId)
            .order('created_at', { ascending: true });

        if (!error && data) {
            chat.messages = data.map(row => ({
                id: row.id,
                senderId: row.sender_id,
                text: row.text,
                timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
        }

        renderMessages(chat);

        // 2. Real-time Subscription
        if (currentSupabaseSubscription) {
            window.supabaseClient.removeChannel(currentSupabaseSubscription);
        }

        currentSupabaseSubscription = window.supabaseClient
            .channel(`chat_${activeChatId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${activeChatId}` }, payload => {
                const newRow = payload.new;
                // Add message directly when it streams in
                if (!chat.messages.find(m => m.id === newRow.id)) {
                    chat.messages.push({
                        id: newRow.id,
                        senderId: newRow.sender_id,
                        text: newRow.text,
                        timestamp: new Date(newRow.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                    renderMessages(chat);
                }
            })
            .subscribe();

    } else {
        renderMessages(chat); // Mock fallback
    }
}

function renderMessages(chat) {
    messagesContainer.innerHTML = '';

    // Encryption Banner (WhatsApp Style)
    const encryptionMsg = document.createElement('div');
    encryptionMsg.className = 'encryption-lock';
    encryptionMsg.innerHTML = '<i class="ph ph-lock-key"></i> Messages are end-to-end encrypted. No one outside of this chat can read them.';
    messagesContainer.appendChild(encryptionMsg);

    if (!chat.messages || chat.messages.length === 0) {
        messagesContainer.innerHTML += '<div class="text-center text-dimmed mt-8">No vibes here yet. Send a message! 🚀</div>';
        return;
    }

    chat.messages.forEach(msg => {
        const isSentByMe = msg.senderId === currentUser.id;
        const isSystem = msg.senderId === 'system';
        const senderName = getDisplayName(msg.senderId);
        const senderAvatar = isSystem ? '' : (isSentByMe ? currentUser.avatar : (users[msg.senderId]?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`));

        if (isSystem) {
            const sysBox = document.createElement('div');
            sysBox.style.cssText = 'padding: 6px 16px; background: rgba(255,255,255,0.05); color: var(--text-muted); font-size: 0.8rem; border-radius: 12px; align-self: center; margin: 8px 0; font-weight: 600; text-align: center; border: 1px solid var(--border-color);';
            sysBox.textContent = msg.text;
            messagesContainer.appendChild(sysBox);
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${isSentByMe ? 'sent' : 'received'}`;

        let msgHtml = `
            <div class="message-bubble ${msg.isAnnouncement ? 'announcement-vibe' : ''} ${msg.starred ? 'starred' : ''}">
                ${msg.isAnnouncement ? `<div class="badge-announcement text-xs mb-1"><i class="ph ph-megaphone-simple"></i> ANNOUNCEMENT</div>` : ''}
                ${(chat.type === 'group' || chat.type === 'community') && !isSentByMe ? `<span class="message-sender">${senderName}</span>` : ''}
                ${msg.image ? `<img src="${msg.image}" style="width:100%; max-width:250px; border-radius:12px; margin-bottom:8px;">` : ''}
                <div class="message-text">
                    ${msg.text.replace(/(^|\s)@(\w+(?:\s\w+)?)/g, '$1<span class="mention" style="color:var(--accent-primary); font-weight:700; cursor:pointer;">@$2</span>')}
                </div>
                <div class="message-time">
                    ${msg.timestamp}
                    ${msg.starred ? '<i class="ph-fill ph-star" style="color:var(--warning); margin-left:4px;"></i>' : ''}
                </div>
            </div>
        `;
        wrapper.innerHTML = msgHtml;
        messagesContainer.appendChild(wrapper);
    });

    scrollToBottom();
}

// --- Chat Management Actions ---
window.starChat = function () {
    if (!activeChatId) return;
    const chat = [...chatsData, ...groupsData, ...communitiesData].find(c => c.id === activeChatId);
    if (chat) {
        chat.starred = !chat.starred;
        alert(chat.starred ? "Chat starred! ⭐" : "Chat unstarred.");
        renderChatsList();
        renderGroupsList();
    }
};

window.muteChat = function () {
    if (!activeChatId) return;
    const chat = [...chatsData, ...groupsData, ...communitiesData].find(c => c.id === activeChatId);
    if (chat) {
        chat.muted = !chat.muted;
        alert(chat.muted ? "Group muted! 🔇" : "Group unmuted! 🔔");
        renderChatsList();
        renderGroupsList();
    }
};

window.clearChat = function () {
    if (!confirm("Clear all messages in this chat? 💀")) return;
    const chat = [...chatsData, ...groupsData, ...communitiesData].find(c => c.id === activeChatId);
    if (chat) {
        chat.messages = [];
        renderMessages(chat);
    }
};

window.deleteChat = function () {
    if (!confirm("Delete this chat? This cannot be undone. 🔥")) return;
    const index = chatsData.findIndex(c => c.id === activeChatId);
    if (index !== -1) {
        chatsData.splice(index, 1);
        switchTab('chats');
        renderChatsList();
    }
};

window.setTheme = function (themeName, element) {
    document.body.setAttribute('data-theme', themeName === 'default' ? '' : themeName);
    document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
    element.classList.add('active');

    // Update theme color meta tag
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    const colorMap = {
        'default': '#00f2ff',
        'emerald': '#00ffaa',
        'royal': '#7000ff',
        'sunset': '#ffaa00',
        'coral': '#ff007f'
    };
    if (metaTheme) metaTheme.content = colorMap[themeName] || '#00f2ff';
};

window.archiveChat = function () {
    if (!activeChatId) return;
    const chat = [...chatsData, ...groupsData, ...communitiesData].find(c => c.id === activeChatId);
    if (chat) {
        chat.archived = !chat.archived;
        alert(chat.archived ? "Chat archived! 🗄️" : "Chat unarchived! 📂");
        renderChatsList();
        switchTab('chats');
    }
};

window.logout = function () {
    if (confirm("Logout from UNIBUZZ? 🥺")) {
        // Keep last_user for "Continue As" functionality
        const lastUser = { name: currentUser.name, avatar: currentUser.avatar, email: currentUser.email };
        localStorage.setItem('last_user', JSON.stringify(lastUser));

        localStorage.removeItem('unibuzz_session');
        if (window.supabaseClient) window.supabaseClient.auth.signOut();
        location.reload();
    }
};

window.saveWallpaper = function () {
    const url = document.getElementById('wp-url-input').value;
    if (url) {
        localStorage.setItem('custom_wallpaper', url);
        const msgsArea = document.querySelector('.messages-area');
        msgsArea.style.backgroundImage = `url(${url})`;
        msgsArea.style.backgroundSize = 'cover';
        msgsArea.style.backgroundPosition = 'center';
        alert("Wallpaper applied! 🖼️");
        document.getElementById('chats-settings-modal').classList.add('hidden');
    }
};

window.syncOlderMessages = function () {
    alert("Scanning database for historical buzz... 📡\n(Sync complete up to 2024)");
};

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;

    if (window.supabaseClient) {
        // Insert into Supabase Table
        const payload = {
            chat_id: activeChatId,
            sender_id: currentUser.id,
            text: text
        };

        const { data, error } = await window.supabaseClient.from('messages').insert([payload]);

        if (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message: " + error.message);
        } else {
            messageInput.value = '';
            localStorage.removeItem(`draft_${activeChatId}`);
            // Local fallback scroll/render (Subscription will handle the actual UI update)
            scrollToBottom();
        }
    } else {
        // Fallback mock logic
        const chatItems = currentTab === 'chats' ? chatsData : (currentTab === 'groups' ? groupsData : communitiesData);
        const chat = chatItems.find(c => c.id === activeChatId);

        if (chat) {
            const newMsg = {
                id: 'm' + Date.now(),
                senderId: currentUser.id,
                text: text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            chat.messages.push(newMsg);
            renderMessages(chat);
            messageInput.value = '';
            localStorage.removeItem(`draft_${activeChatId}`);
            scrollToBottom();
            if (currentTab === 'chats') renderChatsList();
            else if (currentTab === 'groups') renderGroupsList();
            else renderCommunitiesList();
        }
    }
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: 'smooth'
        });
    });
}

async function sendAttachment(base64Image) {
    if (!activeChatId) return;

    if (window.supabaseClient) {
        const { error } = await window.supabaseClient.from('messages').insert([{
            chat_id: activeChatId,
            sender_id: currentUser.id,
            text: '📷 Photo',
            image: base64Image // Assuming base64 is supported or that storage is handled elsewhere
        }]);
        if (error) alert("Error sending attachment: " + error.message);
    } else {
        const chatItems = currentTab === 'chats' ? chatsData : (currentTab === 'groups' ? groupsData : communitiesData);
        const chat = chatItems.find(c => c.id === activeChatId);
        if (chat) {
            const newMsg = {
                id: 'm' + Date.now(),
                senderId: currentUser.id,
                text: '📷 Photo',
                image: base64Image,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            chat.messages.push(newMsg);
            renderMessages(chat);
        }
    }
    chatFileInput.value = '';
}

// --- Group Info View ---
function populateGroupInfo() {
    const list = [...groupsData, ...communitiesData];
    const group = list.find(g => g.id === activeChatId);
    if (!group) return;

    // Ensure admins array always exists
    if (!group.admins) group.admins = [];
    if (!group.members) group.members = [];

    document.getElementById('info-avatar').src = group.avatar;
    document.getElementById('info-name').textContent = group.topic;

    const membersListUI = document.getElementById('info-members-list');
    membersListUI.innerHTML = '';

    const isAdmin = group.admins.includes(currentUser.id);

    // Member list
    group.members.forEach(mId => {
        const uName = getDisplayName(mId);
        const uAvatar = mId === currentUser.id ? currentUser.avatar : (users[mId]?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=random`);

        const li = document.createElement('li');
        li.className = 'member-item relative';

        const isMAdmin = group.admins?.includes(mId);
        let roleBadge = isMAdmin ? '<span class="member-role">Admin</span>' : '';
        let deleteBtn = (isAdmin && !isMAdmin && mId !== currentUser.id) ?
            `<button class="icon-btn ml-auto text-danger delete-member-btn" style="padding:4px;" data-id="${mId}"><i class="ph ph-trash"></i></button>` : '';

        li.innerHTML = `
            <img src="${uAvatar}" class="avatar avatar-sm my-auto mr-2" style="margin-right:8px;" alt="">
            <span class="member-name">${mId === currentUser.id ? 'You' : uName}</span>
            ${roleBadge}
            ${deleteBtn}
        `;
        membersListUI.appendChild(li);
    });

    // Toggle button visibility based on admin status
    const leaveBtn = document.getElementById('leave-group-btn');
    if (isAdmin) {
        leaveBtn.innerHTML = '<i class="ph ph-trash"></i> Delete Group';
        leaveBtn.onclick = deleteGroup;
    } else {
        leaveBtn.innerHTML = '<i class="ph ph-sign-out"></i> Leave Group';
        leaveBtn.onclick = leaveGroup;
    }

    // Handle Delete dynamically (Supabase Sync)
    document.querySelectorAll('.delete-member-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const mId = e.currentTarget.getAttribute('data-id');
            const uName = getDisplayName(mId);
            const confirmed = confirm(`Are you sure you want to remove ${uName}?`);
            if (!confirmed) return;

            if (window.supabaseClient && !users[mId]?.isDummy && !mId.startsWith('guest_')) {
                const { error } = await window.supabaseClient.from('group_members')
                    .delete().match({ group_id: activeChatId, user_id: mId });
                if (error) { alert("Error removing member: " + error.message); return; }

                // Add System Message to DB
                await window.supabaseClient.from('messages').insert([{
                    chat_id: activeChatId,
                    sender_id: 'system',
                    text: `${uName} was removed.`
                }]);
            } else {
                // Local or dummy handling: update messages locally
                group.messages.push({
                    senderId: 'system',
                    text: `${uName} was removed.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
                renderMessages(group);
            }

            group.members = group.members.filter(id => id !== mId);
            chatStatus.textContent = `${group.members.length} members`;
            populateGroupInfo();
        });
    });

    // Add Member Section Support
    const addSection = document.getElementById('add-member-section');
    const addSelect = document.getElementById('add-new-member-select');
    const addBtn = document.getElementById('add-new-member-btn');

    if (isAdmin) {
        addSection.style.display = 'flex';
        addSelect.innerHTML = '<option value="" disabled selected>Select user...</option>';
        Object.entries(users).forEach(([id, u]) => {
            if (!group.members.includes(id)) {
                addSelect.innerHTML += `<option value="${id}">${u.name}</option>`;
            }
        });

        // Remove old listener to avoid dupes
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);

        newAddBtn.addEventListener('click', async () => {
            const newMemberId = document.getElementById('add-new-member-select').value;
            const uName = getDisplayName(newMemberId);
            if (newMemberId && !group.members.includes(newMemberId)) {
                if (window.supabaseClient && !users[newMemberId]?.isDummy) {
                    const { error } = await window.supabaseClient.from('group_members')
                        .insert([{ group_id: activeChatId, user_id: newMemberId, is_admin: false }]);
                    if (error) { alert("Error adding member: " + error.message); return; }

                    // Add System Message to DB
                    await window.supabaseClient.from('messages').insert([{
                        chat_id: activeChatId,
                        sender_id: 'system',
                        text: `${uName} was added to the group.`
                    }]);
                }

                group.members.push(newMemberId);
                chatStatus.textContent = `${group.members.length} members`;
                populateGroupInfo();
                // Local fallback or dummy handling
                if (!window.supabaseClient || users[newMemberId]?.isDummy) {
                    group.messages.push({ senderId: 'system', text: `${uName} was added.`, timestamp: new Date().toLocaleTimeString() });
                    renderMessages(group);
                }
            }
        });
    } else {
        addSection.style.display = 'none';
    }
}

// --- Lost & Found View ---
function openLFItem(item) {
    activeLFId = item.id;
    activeChatId = null;
    const isAuthor = item.author === currentUser.id;

    chatView.classList.add('hidden');
    emptyState.classList.add('hidden');
    lfView.classList.remove('hidden');

    document.getElementById('lf-view-title').textContent = `${item.type === 'lost' ? 'Lost' : 'Found'} Details`;

    const uName = getDisplayName(item.author);
    const uAvatar = item.author === currentUser.id ? currentUser.avatar : (users[item.author]?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(uName)}&background=random`);

    document.getElementById('lf-dynamic-area').innerHTML = `
        <div class="glass p-6 rounded-3xl mb-6 border border-white/5 shadow-2xl">
            <div class="flex items-center gap-3 mb-6">
                <img src="${uAvatar}" class="avatar avatar-md border border-white/10">
                <div>
                    <div class="font-bold text-main">${item.author === currentUser.id ? 'You' : uName}</div>
                    <div class="text-xs text-dimmed">${item.timestamp}</div>
                </div>
            </div>
            <h2 class="text-3xl mb-4 font-extrabold tracking-tight text-main">${item.title}</h2>
            <div class="tag ${item.type === 'lost' ? 'tag-lost' : 'tag-found'} mb-6 inline-block">${item.type.toUpperCase()}</div>
            <p class="mb-8 text-lg color-text-muted leading-relaxed">${item.description}</p>
            ${item.image ? `<img src="${item.image}" class="w-full rounded-2xl mb-8 shadow-2xl border border-white/5" id="lf-large-img" style="max-height: 450px; width: 100%; object-fit: contain; background: #000;">` : ''}
            
            <div class="p-5 bg-white/5 border border-white/5 rounded-2xl mb-8">
                <div class="text-xs text-dimmed uppercase mb-2 font-bold tracking-widest">Contact Info</div>
                <div class="font-medium text-lg">${item.contact}</div>
            </div>
            
            <div class="flex gap-4">
                ${!isAuthor ? `
                <button class="primary-btn flex-1 py-4 flex items-center justify-center gap-3" style="border-radius:18px; font-size:1.1rem; background: var(--accent-primary);" onclick="contactAuthor('${item.author}', '${encodeURIComponent(item.title)}')">
                    <i class="ph-fill ph-chat-circle-dots" style="font-size:1.3rem;"></i> Start Direct Buzz
                </button>` : `
                <button class="danger-btn flex-1 py-4 flex items-center justify-center gap-3" style="border-radius:18px; font-size:1.1rem;" onclick="deleteLFItem('${item.id}')">
                    <i class="ph-fill ph-trash" style="font-size:1.3rem;"></i> Remove Posting
                </button>`}
            </div>
        </div>
    `;
}

window.deleteLFItem = async function (itemId) {
    const confirmed = confirm("Are you sure you want to delete this listing? This action cannot be undone.");
    if (!confirmed) return;

    const isGuest = currentUser.id.startsWith('guest_');

    if (window.supabaseClient && !isGuest) {
        // Delete only by id — RLS policy on Supabase protects against unauthorized deletes
        const { error } = await window.supabaseClient.from('listings').delete().eq('id', itemId);
        if (error) {
            alert("Error deleting listing: " + error.message);
            return;
        }
        // Real-time subscription will update lostFoundData, but also update locally for instant feedback
    }

    // Always update local data immediately for instant UI feedback
    const index = lostFoundData.findIndex(i => i.id === itemId);
    if (index !== -1) {
        lostFoundData.splice(index, 1);
    }

    activeLFId = null;
    renderLFList();
    switchTab('lost-found');
    alert("Listing deleted successfully. ✅");
};

window.contactAuthor = async function (authorId, title) {
    if (authorId === currentUser.id) return alert("You cannot contact yourself!");
    const authorName = getDisplayName(authorId);
    const authorContact = users[authorId] || { name: authorName || 'Student', avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName || 'S')}&background=random` };

    // --- FAST PATH: Check if a direct chat already exists locally ---
    let chat = chatsData.find(c =>
        c.type === 'direct' &&
        c.members && c.members.includes(authorId) && c.members.includes(currentUser.id)
    );

    if (!chat) {
        // Create chat locally first for instant UI response (no lag)
        chat = {
            id: 'c_dm_' + Date.now(),
            topic: authorContact.name,
            avatar: authorContact.avatar,
            type: 'direct',
            members: [currentUser.id, authorId],
            admins: [currentUser.id],
            messages: []
        };
        chatsData.unshift(chat);

        // Persist to Supabase in the background (non-blocking)
        const isGuest = currentUser.id.startsWith('guest_') || authorId.startsWith('guest_');
        if (window.supabaseClient && !isGuest) {
            const chatPayload = { topic: authorContact.name, avatar: authorContact.avatar, type: 'direct' };
            window.supabaseClient.from('groups').insert([chatPayload]).select().then(({ data, error }) => {
                if (!error && data && data[0]) {
                    // Update the local chat id with the real DB id
                    chat.id = data[0].id;
                    window.supabaseClient.from('group_members').insert([
                        { group_id: chat.id, user_id: currentUser.id, is_admin: true },
                        { group_id: chat.id, user_id: authorId, is_admin: false }
                    ]).catch(console.error);
                }
            }).catch(console.error);
        }
    }

    renderChatsList();
    switchTab('chats');

    // Immediately open chat — no timeout needed since we created it locally
    openChat(chat);
    setTimeout(() => {
        messageInput.value = "Hi! I'm buzzing about your listing: \"" + decodeURIComponent(title) + "\". Still available?";
        messageInput.focus();
    }, 100);
}

// --- Modals (Add Data) ---
function handleAddNewAction() {
    modalOverlay.classList.remove('hidden');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    if (currentTab === 'chats') {
        modalTitle.textContent = 'New Chat';
        modalBody.innerHTML = `
            <div class="list-item" style="cursor:pointer; background:rgba(59, 130, 246, 0.1); border-radius:8px; padding:10px; margin-bottom:0.5rem; align-items:center;" onclick="handleTabDirect('groups')">
                <div class="avatar avatar-sm flex items-center justify-center bg-accent-primary" style="background:var(--accent-primary); color:white; border-radius:50%;"><i class="ph ph-users" style="font-size:1.2rem;"></i></div>
                <div class="item-content" style="margin-left:10px;">
                    <div class="item-title" style="font-weight:bold; color:var(--text-main);">New Group</div>
                </div>
            </div>
            <div class="list-item" style="cursor:pointer; background:rgba(16, 185, 129, 0.1); border-radius:8px; padding:10px; margin-bottom:1rem; align-items:center;" onclick="handleTabDirect('communities')">
                <div class="avatar avatar-sm flex items-center justify-center" style="background:#10b981; color:white; border-radius:50%;"><i class="ph ph-users-three" style="font-size:1.2rem;"></i></div>
                <div class="item-content" style="margin-left:10px;">
                    <div class="item-title" style="font-weight:bold; color:var(--text-main);">New Community</div>
                </div>
            </div>
            <div class="form-group" style="border-top:1px solid var(--border-color); padding-top:1rem;">
                <label style="font-size:0.9rem; margin-bottom:0.8rem; display:block; font-weight:600;">Or Start a Personal Chat (Direct):</label>
                <div class="scrollable custom-scrollbar" style="max-height: 220px; padding-right:5px; display:flex; flex-direction:column; gap:8px;">
                    ${Object.entries(users).filter(([id, u]) => id !== currentUser.id && !u.isDummy).map(([id, u]) => `
                        <div class="list-item hover-bg" style="cursor:pointer; padding:10px; border-radius:12px; align-items:center; display:flex; background:rgba(255,255,255,0.03);" onclick="createChat('${id}')">
                            <img src="${u.avatar}" class="avatar avatar-sm">
                            <div class="item-content" style="margin-left:12px;">
                                <div class="item-title text-sm" style="font-weight:bold; color:var(--text-main);">${u.name}</div>
                            </div>
                            <i class="ph ph-chat-circle text-dimmed ml-auto"></i>
                        </div>
                    `).join('')}
                    ${Object.entries(users).filter(([id, u]) => id !== currentUser.id && !u.isDummy).length === 0 ? '<div class="text-sm text-dimmed text-center mt-2">No other registered users.</div>' : ''}
                </div>
            </div>
        `;
    }

    window.handleTabDirect = function (tab) {
        closeModal();
        switchTab(tab);
        setTimeout(handleAddNewAction, 100);
    };

    if (currentTab === 'groups' || currentTab === 'communities') {
        const isComm = currentTab === 'communities';
        modalTitle.textContent = isComm ? 'Create New Community' : 'Create New Group';
        modalBody.innerHTML = `
            <div class="form-group">
                <label>${isComm ? 'Community' : 'Group'} Name</label>
                <input type="text" id="new-group-name" placeholder="e.g. ${isComm ? 'Campus Noticeboard' : 'Study Group'}">
            </div>
            <div class="form-group mb-2">
                <label>Select Members</label>
                <div class="scrollable custom-scrollbar p-2 border-radius-md" style="max-height: 120px; border: 1px solid var(--border-color); background: var(--bg-main);">
                    ${Object.entries(users).map(([id, u]) => {
            if (id === currentUser.id) return '';
            return `
                        <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; cursor:pointer;">
                            <input type="checkbox" name="group-member" value="${id}" checked>
                            <img src="${u.avatar}" class="avatar avatar-sm">
                            <span class="text-sm">${u.name}</span>
                        </label>
                    `}).join('')}
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <input type="text" id="new-group-desc" placeholder="What is this about?">
            </div>
            <button class="primary-btn mt-4 w-full" onclick="${isComm ? 'createCommunity()' : 'createGroup()'}">Create</button>
        `;

        // --- Modal Autosave (Groups/Communities) ---
        const GC_DRAFT_KEY = isComm ? 'comm_form_draft' : 'group_form_draft';
        const saveGCDraft = () => {
            const draft = {
                name: document.getElementById('new-group-name').value,
                desc: document.getElementById('new-group-desc').value
            };
            localStorage.setItem(GC_DRAFT_KEY, JSON.stringify(draft));
        };
        const restoreGCDraft = () => {
            const saved = localStorage.getItem(GC_DRAFT_KEY);
            if (saved) {
                const draft = JSON.parse(saved);
                document.getElementById('new-group-name').value = draft.name;
                document.getElementById('new-group-desc').value = draft.desc;
            }
        };
        restoreGCDraft();
        ['new-group-name', 'new-group-desc'].forEach(id => {
            document.getElementById(id).addEventListener('input', saveGCDraft);
        });
    } else if (currentTab === 'lost-found') {
        modalTitle.textContent = 'Post a Listing';
        lfSelectedImage = null; // Reset
        modalBody.innerHTML = `
            <div class="form-group">
                <label>Listing Type</label>
                <select id="lf-type">
                    <option value="lost">Lost an item</option>
                    <option value="found">Found an item</option>
                </select>
            </div>
            <div class="form-group">
                <label>Title</label>
                <input type="text" id="lf-title" placeholder="Brief identifier (e.g. Blue Hydroflask)">
            </div>
            <div class="form-group">
                <label>Category</label>
                <select id="lf-category">
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing & Accessories</option>
                    <option value="keys">Keys & Wallets</option>
                    <option value="documents">Documents</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description & Location</label>
                <textarea id="lf-desc" rows="3" placeholder="Where did you see it last?"></textarea>
            </div>
            <div class="form-group">
                <label>Contact Info</label>
                <input type="text" id="lf-contact" placeholder="Phone number or email">
            </div>
            <div class="upload-area mb-4" id="lf-upload-area" onclick="document.getElementById('lf-image-input').click()">
                <i class="ph ph-camera"></i>
                <p id="lf-upload-text">Click to upload image</p>
                <img id="lf-preview-img" style="display:none; width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-top: 10px;"/>
            </div>
            <input type="file" id="lf-image-input" accept="image/*" style="display: none;">
            <button class="primary-btn w-full" id="lf-submit-btn" onclick="addMockLF()">Post Listing</button>
        `;

        document.getElementById('lf-image-input').addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (evt) {
                    lfSelectedImage = evt.target.result;
                    document.getElementById('lf-preview-img').src = lfSelectedImage;
                    document.getElementById('lf-preview-img').style.display = 'block';
                    document.getElementById('lf-upload-text').textContent = 'Image selected (click to change)';
                };
                reader.readAsDataURL(file);
            }
        });

        // --- Modal Autosave (Lost & Found) ---
        const LF_DRAFT_KEY = 'lf_form_draft';
        const saveLFDraft = () => {
            const el = id => document.getElementById(id);
            if (!el('lf-type')) return;
            const draft = {
                type: el('lf-type').value,
                title: el('lf-title').value,
                category: el('lf-category').value,
                desc: el('lf-desc').value,
                contact: el('lf-contact').value
            };
            localStorage.setItem(LF_DRAFT_KEY, JSON.stringify(draft));
        };

        const restoreLFDraft = () => {
            const saved = localStorage.getItem(LF_DRAFT_KEY);
            if (saved) {
                const draft = JSON.parse(saved);
                document.getElementById('lf-type').value = draft.type;
                document.getElementById('lf-title').value = draft.title;
                document.getElementById('lf-category').value = draft.category;
                document.getElementById('lf-desc').value = draft.desc;
                document.getElementById('lf-contact').value = draft.contact;
            }
        };

        restoreLFDraft();
        ['lf-type', 'lf-title', 'lf-category', 'lf-desc', 'lf-contact'].forEach(id => {
            document.getElementById(id).addEventListener('input', saveLFDraft);
        });
    }
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}

// exposed functions for mock forms
async function leaveGroup() {
    if (!activeChatId) return;
    const confirmed = confirm("Are you sure you want to leave this group?");
    if (!confirmed) return;

    if (window.supabaseClient) {
        const { error } = await window.supabaseClient.from('group_members')
            .delete().match({ group_id: activeChatId, user_id: currentUser.id });
        if (error) { alert("Error leaving group: " + error.message); return; }

        // Add System Message to DB
        await window.supabaseClient.from('messages').insert([{
            chat_id: activeChatId,
            sender_id: 'system',
            text: `${getDisplayName(currentUser.id)} left.`
        }]);
    }

    // Cleanup local state
    groupsData = groupsData.filter(g => g.id !== activeChatId);
    communitiesData = communitiesData.filter(g => g.id !== activeChatId);
    chatsData = chatsData.filter(c => c.id !== activeChatId);

    renderGroupsList();
    renderCommunitiesList();
    renderChatsList();
    switchTab('chats');
}

async function deleteGroup() {
    if (!activeChatId) return;
    const confirmed = confirm("ADMIN ALERT: Are you sure you want to PERMANENTLY DELETE this group and remove all members? This cannot be undone.");
    if (!confirmed) return;

    if (window.supabaseClient) {
        // Cascade should handle details if FKs are set, but we aim for the group row
        const { error } = await window.supabaseClient.from('groups').delete().eq('id', activeChatId);
        if (error) { alert("Error deleting group: " + error.message); return; }
    }

    // Local cleanup
    groupsData = groupsData.filter(g => g.id !== activeChatId);
    communitiesData = communitiesData.filter(g => g.id !== activeChatId);
    chatsData = chatsData.filter(c => c.id !== activeChatId);

    renderGroupsList();
    renderCommunitiesList();
    renderChatsList();
    switchTab('chats');
}

window.createChat = async function (contactIdParam) {
    const contactId = contactIdParam || document.getElementById('new-chat-contact')?.value;
    const contact = users[contactId];
    if (!contact) return;

    // Check if direct chat already exists locally
    let existingChat = chatsData.find(c => c.type === 'direct' && c.participants && c.participants.includes(contactId) && c.participants.includes(currentUser.id));

    if (existingChat) {
        closeModal();
        openChat(existingChat, document.querySelector(`.list-item[data-chat-id="${existingChat.id}"]`));
        return;
    }

    const chatPayload = {
        topic: contact.name,
        avatar: contact.avatar,
        type: 'direct'
    };

    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from('groups').insert([chatPayload]).select();
        if (!error && data) {
            const newChatId = data[0].id;
            const validMembers = [currentUser.id];
            if (contactId) {
                validMembers.push(contactId);
            }

            const membersData = validMembers.map(mId => ({ group_id: newChatId, user_id: mId, is_admin: mId === currentUser.id }));

            if (membersData.length > 0) {
                await window.supabaseClient.from('group_members').insert(membersData);
            }

            const newChat = {
                ...data[0],
                participants: [currentUser.id, contactId],
                members: [currentUser.id, contactId],
                messages: []
            };
            chatsData.unshift(newChat);
            renderChatsList();
            closeModal();
            setTimeout(() => {
                openChat(newChat, document.querySelector(`.list-item[data-chat-id="${newChat.id}"]`));
            }, 50);
        }
    } else {
        const newChat = {
            id: 'c' + Date.now(),
            ...chatPayload,
            participants: [currentUser.id, contactId],
            messages: [{ senderId: currentUser.id, text: `Started a chat with ${contact.name}`, timestamp: 'Just now' }]
        };
        chatsData.unshift(newChat);
        renderChatsList();
        closeModal();
        setTimeout(() => {
            openChat(newChat, document.querySelector(`.list-item[data-chat-id="${newChat.id}"]`));
        }, 50);
    }
};

window.createGroup = async function () {
    const name = document.getElementById('new-group-name').value || 'New Group';
    const checkboxes = document.querySelectorAll('input[name="group-member"]:checked');
    const selectedMembers = [currentUser.id];
    checkboxes.forEach(cb => {
        if (!selectedMembers.includes(cb.value)) selectedMembers.push(cb.value);
    });

    const groupPayload = {
        topic: name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        description: document.getElementById('new-group-desc').value,
        type: 'group'
    };

    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from('groups').insert([groupPayload]).select();
        if (error) {
            alert("Error creating group: " + error.message);
            return;
        }
        if (!error && data) {
            const newGroupId = data[0].id;
            const validMembers = selectedMembers.filter(mId => !users[mId]?.isDummy);
            const membersData = validMembers.map(mId => ({ group_id: newGroupId, user_id: mId, is_admin: mId === currentUser.id }));

            if (membersData.length > 0) {
                const { error: membersError } = await window.supabaseClient.from('group_members').insert(membersData);
                if (membersError) {
                    alert("Error adding members: " + membersError.message);
                    return;
                }

                // Add System Messages for each member
                const systemMsgs = selectedMembers.map(mId => ({
                    chat_id: newGroupId,
                    sender_id: 'system',
                    text: mId === currentUser.id ? `You created the group "${groupPayload.topic}"` : `${getDisplayName(mId)} was added.`
                }));
                await window.supabaseClient.from('messages').insert(systemMsgs);
            }

            // Local update
            const fullGroup = { ...data[0], members: selectedMembers, admins: [currentUser.id], messages: [{ senderId: 'system', text: `You created the group "${groupPayload.topic}"`, timestamp: 'Just now' }] };
            groupsData.unshift(fullGroup);
            chatsData.unshift(fullGroup);
            activeChatId = fullGroup.id;
            localStorage.removeItem('group_form_draft');
            renderGroupsList();
            renderChatsList();
            closeModal();
            openChat(fullGroup);
        }
    } else {
        // LOCAL FALLBACK
        const localGroup = {
            id: 'g' + Date.now(),
            ...groupPayload,
            members: selectedMembers,
            admins: [currentUser.id],
            messages: [{ senderId: 'system', text: `You created the group "${groupPayload.topic}"`, timestamp: 'Just now' }]
        };
        groupsData.unshift(localGroup);
        chatsData.unshift(localGroup);
        activeChatId = localGroup.id;
        localStorage.removeItem('group_form_draft');
        renderGroupsList();
        renderChatsList();
        closeModal();
        openChat(localGroup);
    }
}

window.createCommunity = async function () {
    const name = document.getElementById('new-group-name').value || 'New Community';
    const checkboxes = document.querySelectorAll('input[name="group-member"]:checked');
    const selectedMembers = [currentUser.id];
    checkboxes.forEach(cb => {
        if (!selectedMembers.includes(cb.value)) selectedMembers.push(cb.value);
    });

    const commPayload = {
        topic: name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
        description: document.getElementById('new-group-desc').value,
        type: 'community'
    };

    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from('groups').insert([commPayload]).select();
        if (error) {
            alert("Error creating community: " + error.message);
            return;
        }
        if (!error && data) {
            const newCommId = data[0].id;
            const validMembers = selectedMembers.filter(mId => !users[mId]?.isDummy);
            const membersData = validMembers.map(mId => ({ group_id: newCommId, user_id: mId, is_admin: mId === currentUser.id }));

            if (membersData.length > 0) {
                const { error: membersError } = await window.supabaseClient.from('group_members').insert(membersData);
                if (membersError) {
                    alert("Error adding members: " + membersError.message);
                    return;
                }

                // Add System Messages for each member
                const systemMsgs = selectedMembers.map(mId => ({
                    chat_id: newCommId,
                    sender_id: 'system',
                    text: mId === currentUser.id ? `You created the community "${commPayload.topic}"` : `${getDisplayName(mId)} was added.`
                }));
                await window.supabaseClient.from('messages').insert(systemMsgs);
            }

            // Local update
            const fullComm = { ...data[0], members: selectedMembers, admins: [currentUser.id], messages: [{ senderId: 'system', text: `You created the community "${commPayload.topic}"`, timestamp: 'Just now' }] };
            communitiesData.unshift(fullComm);
            chatsData.unshift(fullComm);
            activeChatId = fullComm.id;
            localStorage.removeItem('comm_form_draft');
            renderCommunitiesList();
            renderChatsList();
            closeModal();
            openChat(fullComm);
        }
    } else {
        // LOCAL FALLBACK
        const localComm = {
            id: 'cm' + Date.now(),
            ...commPayload,
            members: selectedMembers,
            admins: [currentUser.id],
            messages: [{ senderId: 'system', text: `You created the community "${commPayload.topic}"`, timestamp: 'Just now' }]
        };
        communitiesData.unshift(localComm);
        chatsData.unshift(localComm);
        activeChatId = localComm.id;
        localStorage.removeItem('comm_form_draft');
        renderCommunitiesList();
        renderChatsList();
        closeModal();
        openChat(localComm);
    }
}

window.addMockLF = async function () {
    const titleEl = document.getElementById('lf-title');
    const typeEl = document.getElementById('lf-type');
    const catEl = document.getElementById('lf-category');
    const descEl = document.getElementById('lf-desc');
    const contactEl = document.getElementById('lf-contact');

    if (!titleEl.value || !descEl.value) {
        alert("Please fill in both the title and description.");
        return;
    }

    const btn = document.getElementById('lf-submit-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Posting...';
    }

    const payload = {
        title: titleEl.value,
        type: typeEl.value,
        description: `[${catEl.value.toUpperCase()}] ${descEl.value}`,
        author_id: currentUser.id,
        image_url: lfSelectedImage,
        contact: contactEl.value || currentUser.name
    };

    if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from('listings').insert([payload]).select();
        if (error) {
            alert("Error posting: " + error.message);
            if (btn) { btn.disabled = false; btn.textContent = 'Post Listing'; }
            return;
        }
        if (data && data[0]) {
            const newItem = {
                ...payload,
                id: data[0].id,
                author: payload.author_id,
                image: payload.image_url,
                timestamp: 'Just now'
            };
            lostFoundData.unshift(newItem);
        }
    } else {
        const newItem = {
            id: 'lf' + Date.now(),
            ...payload,
            author: payload.author_id,
            image: payload.image_url,
            timestamp: 'Just now'
        };
        lostFoundData.unshift(newItem);
    }

    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Post Listing';
    }
    localStorage.removeItem('lf_form_draft');
    renderLFList();
    closeModal();
    lfSelectedImage = null; // Clear image
}


async function joinGroup(groupId) {
    const group = [...groupsData, ...communitiesData].find(g => g.id === groupId);

    // LOCAL FALLBACK: for guest users or when no supabase
    if (!window.supabaseClient || currentUser.id.startsWith('guest_')) {
        if (group) {
            if (!group.members) group.members = [];
            if (!group.members.includes(currentUser.id)) {
                group.members.push(currentUser.id);
                group.messages.push({
                    senderId: 'system',
                    text: `${getDisplayName(currentUser.id)} joined.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
            }
            renderGroupsList(); renderCommunitiesList();
            openChat(group);
        }
        return;
    }

    const { data: existing } = await window.supabaseClient
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId)
        .eq('user_id', currentUser.id)
        .maybeSingle();

    if (existing) {
        // Already a member — just sync and open
        await fetchGroups();
        const freshGroup = [...groupsData, ...communitiesData].find(g => g.id === groupId);
        if (freshGroup) openChat(freshGroup);
        return;
    }

    const { error } = await window.supabaseClient.from('group_members').insert([
        { group_id: groupId, user_id: currentUser.id, is_admin: false }
    ]);

    if (error) {
        if (error.code === '23505') {
            // Duplicate — already a member, just open
            await fetchGroups();
            const freshGroup = [...groupsData, ...communitiesData].find(g => g.id === groupId);
            if (freshGroup) openChat(freshGroup);
        } else {
            alert("Error joining group: " + error.message);
        }
        return;
    }

    // Add System Message
    await window.supabaseClient.from('messages').insert([{
        chat_id: groupId,
        sender_id: 'system',
        text: `${getDisplayName(currentUser.id)} joined.`
    }]);

    await fetchGroups();
    const joinedGroup = [...groupsData, ...communitiesData].find(g => g.id === groupId);
    if (joinedGroup) openChat(joinedGroup);
}

function updateJoinStatusUI(chat) {
    const isMember = (chat.type === 'direct') || (chat.members && chat.members.includes(currentUser.id));
    const inputArea = document.querySelector('.chat-input-area');
    const existingOverlay = document.getElementById('join-overlay');

    if (existingOverlay) existingOverlay.remove();

    if (!isMember) {
        inputArea.classList.add('hidden');
        const overlay = document.createElement('div');
        overlay.id = 'join-overlay';
        overlay.className = 'flex items-center justify-center p-6 glass w-full';
        overlay.style.height = '100px';
        overlay.innerHTML = `
            <div class="text-center">
                <p class="mb-2 text-sm text-dimmed">You are not a member of this ${chat.topic}.</p>
                <button class="primary-btn" onclick="joinGroup('${chat.id}')">Join to Participate</button>
            </div>
        `;
        document.getElementById('chat-view').appendChild(overlay);
    } else {
        inputArea.classList.remove('hidden');
    }
}

// --- PREMIUM FEATURES LOGIC ---
// Note: setTheme, starChat, muteChat, deleteChat, archiveChat, clearChat and scrollToBottom
// are all defined earlier in the file — no redefinitions here.

window.exportChat = function () {
    if (!activeChatId) return;
    const chat = [...chatsData, ...groupsData, ...communitiesData].find(c => c.id === activeChatId);
    if (!chat || !chat.messages || chat.messages.length === 0) {
        alert("No messages to export in this chat.");
        return;
    }
    const lines = chat.messages.map(m => {
        const sender = m.senderId === currentUser.id ? 'You' : (m.senderId === 'system' ? 'System' : getDisplayName(m.senderId));
        return `[${m.timestamp}] ${sender}: ${m.text}`;
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chat.topic || 'chat'}_export.txt`;
    a.click();
    URL.revokeObjectURL(url);
};

window.joinGroup = joinGroup;
window.updateJoinStatusUI = updateJoinStatusUI;

// --- Emoji & GIF Logic ---
const emojiData = {
    smileys: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '🤔', '🧐'],
    gestures: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '💍', '💄', '🎨', '🎬', '🎤', '🎧', '🎷', '🎸', '🎹', '🎺', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    people: ['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍🏫', '👨‍🎨', '👩‍🎨', '🧑‍🎨', '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🍳', '👩‍🍳', '🧑‍🍳', '👨‍🔧', '👩‍🔧', '🧑‍🔧', '👨‍🔬', '👩‍🔬', '🧑‍🔬', '👨‍🚀', '👩‍🚀', '🧑‍🚀', '👨‍🚒', '👩‍🚒', '🧑‍🚒', '👮', '🕵️', '💂', '👷', '🤴', '👸', '👳', '👲', '🧕'],
    nature: ['🌿', '🌵', '🎄', '🌲', '🌳', '🌴', '🍀', '🍃', '🍂', '🍁', '🍄', '🐚', '🌞', '🌝', '🌛', '🌜', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌏', '🌍', '🌎', '🌋', '🌌', '🌠', '☄️', '⛈️', '🌥️', '🌦️'],
    food: ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🥘', '🍲', '🍝', '🍜', '🍱', '🍣', '🍤', '🍥', '🍙', '🍚', '🍛', '🍲', '🍚', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🥤', '🧃'],
    travel: ['✈️', '🚀', '🛒', '🚲', '🛵', '🏍️', '🏎️', '🚗', '🚕', '🚙', '🚌', '🚎', '🚐', '🚛', '🚚', '🚜', '🛳️', '⛵', '🛶', '⚓', '🚁', '🚠', '🚟', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺'],
    objects: ['💡', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳'],
    symbols: ['🔥', '✨', '⚡', '💥', '❄️', '🌈', '☀️', '⭐', '🌟', '💫', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌀', '🌡️', '🔥', '💧', '🌊', '💨', '🌀', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙']
};

const curatedGifs = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJnd3Jnd3Jnd3Jnd3Jnd3Jnd3Jnd3Jnd3Jnd3Jnd3Jnd3JndyZXA9djFfaW50ZXJuYWxfZ2lmX2J5X2lkJmN0PWc/3o7TKDkDbIDJieKbVm/giphy.gif',
    'https://media.giphy.com/media/l0HlIDZp6qjZ9H6kY/giphy.gif',
    'https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif',
    'https://media.giphy.com/media/l41lTfuxV5R161bYA/giphy.gif',
    'https://media.giphy.com/media/3o7TKSj0EY3lHGP2b6/giphy.gif',
    'https://media.giphy.com/media/l41m3pCCfRLInL7Tq/giphy.gif'
];

function renderEmojiGrid(category) {
    const grid = document.getElementById('emoji-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const emojis = emojiData[category] || [];
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.style.cssText = 'font-size:24px; padding:8px; cursor:pointer; border-radius:8px; transition:background 0.2s;';
        span.className = 'emoji-item';
        span.onclick = () => {
            messageInput.value += emoji;
            messageInput.focus();
        };
        span.onmouseover = () => span.style.background = 'rgba(255,255,255,0.1)';
        span.onmouseout = () => span.style.background = 'transparent';
        grid.appendChild(span);
    });
}

function renderGifGrid() {
    const grid = document.getElementById('emoji-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="width:100%; padding:10px;"><input type="text" id="gif-search" placeholder="Search GIPHY..." style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); color:white; border-radius:8px;"></div>';
    const container = document.createElement('div');
    container.id = 'gif-results-container';
    container.style.cssText = 'display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:0 8px 8px; width:100%;';

    // Initial curated GIFs
    curatedGifs.forEach(gifUrl => {
        const img = document.createElement('img');
        img.src = gifUrl;
        img.style.cssText = 'width:100%; height:80px; object-fit:cover; border-radius:8px; cursor:pointer;';
        img.onclick = () => {
            sendAttachment(gifUrl);
            emojiPicker.classList.add('hidden');
        };
        container.appendChild(img);
    });
    grid.appendChild(container);

    const searchInput = document.getElementById('gif-search');
    searchInput.onkeyup = (e) => {
        if (e.key === 'Enter') {
            searchGifs(searchInput.value, container);
        }
    };
}

async function searchGifs(query, container) {
    container.innerHTML = '<div style="grid-column: span 2; text-align:center; padding:20px;">Searching...</div>';
    try {
        const resp = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(query)}&limit=10`);
        const data = await resp.json();
        container.innerHTML = '';
        if (data.data.length === 0) {
            container.innerHTML = '<div style="grid-column: span 2; text-align:center; padding:20px;">No GIFs found.</div>';
            return;
        }
        data.data.forEach(gif => {
            const img = document.createElement('img');
            img.src = gif.images.fixed_height_small.url;
            img.style.cssText = 'width:100%; height:80px; object-fit:cover; border-radius:8px; cursor:pointer;';
            img.onclick = () => {
                sendAttachment(gif.images.fixed_height.url);
                emojiPicker.classList.add('hidden');
            };
            container.appendChild(img);
        });
    } catch (e) {
        container.innerHTML = '<div style="grid-column: span 2; text-align:center; padding:20px; color:var(--danger);">Search failed.</div>';
    }
}


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
