class CampusTraceApp {
    constructor() {
        this.apiUrl = 'https://campus-lost-found-r7c2.onrender.com/api';
        this.token = localStorage.getItem('token');
        
        const savedUser = localStorage.getItem('user');
        this.currentUser = savedUser ? JSON.parse(savedUser) : null;
        
        this.items = [];
        this.currentFilter = 'All';
        this.currentDetailId = null; 
        
        this.init();
    }

    init() {
        this.bindEvents();
        if (this.token) {
            this.loadUser();
        } else {
            this.showView('landing');
        }
    }

    bindEvents() {
        // Auth Nav
        document.getElementById('switchToRegister').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'block';
        });

        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
        });

        // Form Submit
        document.getElementById('loginBtn').addEventListener('click', (e) => this.handleLogin(e));
        document.getElementById('registerBtn').addEventListener('click', (e) => this.handleRegister(e));
        document.getElementById('postItemForm').addEventListener('submit', (e) => this.handlePostItem(e));
        document.getElementById('editProfileForm').addEventListener('submit', (e) => this.handleEditProfile(e));

        // Main Nav
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('dashboardBtn').addEventListener('click', () => this.showView('dashboard'));
        document.getElementById('backToPulseBtn').addEventListener('click', () => this.showView('dashboard'));
        document.getElementById('detailBackBtn').addEventListener('click', () => this.showView('dashboard'));
        document.getElementById('postNavBtn').addEventListener('click', () => this.showView('postItemPage'));
        document.getElementById('profileBtn').addEventListener('click', () => {
            this.showView('profilePage');
            this.renderProfile();
        });

        // Edit Profile Nav
        document.getElementById('openEditProfileBtn').addEventListener('click', () => this.openEditProfile());
        document.getElementById('editBackBtn').addEventListener('click', () => this.showView('profilePage'));
        document.getElementById('cancelEditBtn').addEventListener('click', () => this.showView('profilePage'));
        
        // Filters & Search
        const typeButtons = document.querySelectorAll('.sidebar .toggle-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                typeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.innerText;
                this.filterAndRenderItems();
            });
        });

        // Form Type Toggles
        document.getElementById('selectFound').addEventListener('click', (e) => {
            e.target.classList.add('active');
            document.getElementById('selectLost').classList.remove('active');
            document.getElementById('itemType').value = 'found';
        });
        document.getElementById('selectLost').addEventListener('click', (e) => {
            e.target.classList.add('active');
            document.getElementById('selectFound').classList.remove('active');
            document.getElementById('itemType').value = 'lost';
        });

        document.getElementById('searchInput').addEventListener('input', () => this.filterAndRenderItems());
        document.getElementById('hubActionBtn').addEventListener('click', () => this.handleHubAction());
    }

    async apiCall(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
        const config = { method, headers };
        if (body) config.body = JSON.stringify(body);

        const response = await fetch(`${this.apiUrl}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.msg || 'API Error');
        return data;
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const btn = document.getElementById('loginBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AUTHENTICATING...';
            
            const data = await this.apiCall('/auth/login', 'POST', { email, password });
            
            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            
            this.showView('dashboard');
        } catch (error) {
            alert('Authentication Failed: ' + error.message);
            document.getElementById('loginBtn').innerHTML = 'SIGN IN <i class="fas fa-arrow-right"></i>';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const userData = {
            name: document.getElementById('regName').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            department: document.getElementById('regDepartment').value,
            contact: document.getElementById('regContact').value
        };

        try {
            const btn = document.getElementById('registerBtn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> INITIALIZING...';

            const data = await this.apiCall('/auth/register', 'POST', userData);
            
            this.token = data.token;
            this.currentUser = data.user;
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            
            this.showView('dashboard');
        } catch (error) {
            alert('Registration Failed: ' + error.message);
            document.getElementById('registerBtn').innerHTML = 'REGISTER <i class="fas fa-arrow-right"></i>';
        }
    }

    async handlePostItem(e) {
        e.preventDefault();
        
        const btn = document.getElementById('submitPostBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITTING...';

        const formData = new FormData();
        formData.append('type', document.getElementById('itemType').value);
        formData.append('title', document.getElementById('itemTitle').value);
        formData.append('category', document.getElementById('itemCategory').value);
        formData.append('location', document.getElementById('itemLocation').value);
        formData.append('description', document.getElementById('itemDescription').value);
        
        const imageFile = document.getElementById('itemImage').files[0];
        if (imageFile) formData.append('image', imageFile);

        try {
            const response = await fetch(`${this.apiUrl}/items`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` },
                body: formData
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Failed to initialize entry');

            alert('Registry Entry Initialized Successfully!');
            document.getElementById('postItemForm').reset();
            this.showView('dashboard');
            
        } catch (error) {
            alert('Transmission Failed: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
        }
    }

    async loadUser() {
        try {
            this.showView('dashboard');
        } catch (error) {
            this.logout();
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.showView('landing');
    }

    showView(viewId) {
        ['landing', 'dashboard', 'postItemPage', 'profilePage', 'itemDetailPage', 'editProfilePage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = (id === viewId) ? (id === 'landing' ? 'flex' : 'block') : 'none';
        });
        
        const isLoggedOut = viewId === 'landing';
        document.getElementById('dashboardBtn').style.display = isLoggedOut ? 'none' : 'block';
        document.getElementById('postNavBtn').style.display = isLoggedOut ? 'none' : 'block';
        document.getElementById('profileBtn').style.display = isLoggedOut ? 'none' : 'block';
        document.getElementById('logoutBtn').style.display = isLoggedOut ? 'none' : 'flex';

        if (!isLoggedOut && viewId !== 'itemDetailPage' && viewId !== 'editProfilePage') {
            document.getElementById('dashboardBtn').classList.toggle('active', viewId === 'dashboard');
            document.getElementById('postNavBtn').classList.toggle('active', viewId === 'postItemPage');
            document.getElementById('profileBtn').classList.toggle('active', viewId === 'profilePage');
        }

        if (this.currentUser) {
            document.getElementById('navUserName').innerText = this.currentUser.name;
        }

        if (viewId === 'dashboard') this.loadItems();
    }

    async loadItems() {
        try {
            this.items = await this.apiCall('/items');
            this.filterAndRenderItems();
        } catch (error) {
            console.error("Failed to load records:", error);
            document.getElementById('itemsList').innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">Failed to sync with secure server. Ensure backend is running.</div>`;
        }
    }

    filterAndRenderItems() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        const activeItems = this.items.filter(item => item.status !== 'closed');
        
        const filtered = activeItems.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm) || item.description.toLowerCase().includes(searchTerm);
            const matchesType = this.currentFilter === 'All' || item.type.toLowerCase() === this.currentFilter.toLowerCase();
            return matchesSearch && matchesType;
        });

        document.getElementById('recordCount').innerText = filtered.length;
        this.renderItems(filtered);
    }

    renderItems(itemsToRender) {
        const itemsList = document.getElementById('itemsList');
        
        if (itemsToRender.length === 0) {
            itemsList.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: 16px; border: 1px dashed #e5e7eb;">
                    <div style="width: 64px; height: 64px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto;">
                        <i class="fas fa-search" style="font-size: 24px; color: #9ca3af;"></i>
                    </div>
                    <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 5px;">ZERO RECORDS FOUND</h3>
                    <p style="color: #6b7280; font-size: 0.85rem;">ADJUST FILTERS OR SEARCH TERM</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = itemsToRender.map(item => `
            <div class="item-card" onclick="window.app.openItemDetail('${item._id}')" style="padding: 20px; border: 1px solid #e5e7eb; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em; background: ${item.type === 'lost' ? '#fee2e2' : '#d1fae5'}; color: ${item.type === 'lost' ? '#ef4444' : '#10b981'};">
                        ${item.type.toUpperCase()}_ITEM
                    </span>
                    <small style="color: #9ca3af; font-size: 0.75rem;"><i class="far fa-clock"></i> ${new Date(item.createdAt).toLocaleDateString()}</small>
                </div>
                <h4 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">${item.title}</h4>
                <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 15px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${item.description}
                </p>
                <div style="display: flex; gap: 15px; border-top: 1px solid #f3f4f6; padding-top: 15px;">
                    <small style="color: #6b7280; display: flex; align-items: center; gap: 5px;"><i class="fas fa-map-marker-alt" style="color: #4F46E5;"></i> ${item.location}</small>
                    <small style="color: #6b7280; display: flex; align-items: center; gap: 5px;"><i class="fas fa-tag" style="color: #4F46E5;"></i> ${item.category}</small>
                </div>
            </div>
        `).join('');
    }

    renderProfile() {
        if (!this.currentUser) return;
        
        document.getElementById('profileName').innerText = this.currentUser.name;
        document.getElementById('profileEmail').innerText = this.currentUser.email;
        document.getElementById('profileInitial').innerText = this.currentUser.name.charAt(0).toUpperCase();

        const myItems = this.items.filter(item => {
            const ownerId = typeof item.owner === 'object' ? item.owner._id : item.owner;
            return ownerId === this.currentUser.id;
        });

        document.getElementById('profileReportCount').innerText = myItems.length;
        const personalList = document.getElementById('personalItemsList');
        
        if (myItems.length === 0) {
            personalList.innerHTML = `
                <div style="text-align: center; padding: 60px; background: white; border-radius: 24px; border: 1px dashed #e5e7eb;">
                    <div style="width: 64px; height: 64px; background: #f3f4f6; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto;">
                        <i class="far fa-file-alt" style="font-size: 24px; color: #9ca3af;"></i>
                    </div>
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: #9ca3af; letter-spacing: 0.05em; margin-bottom: 5px;">NO ACTIVE REPORTS FOUND</h3>
                    <p style="color: #d1d5db; font-size: 0.85rem;">Any items you report will appear here for management.</p>
                </div>
            `;
            return;
        }

        personalList.innerHTML = myItems.map(item => {
            const isClosed = item.status === 'closed';
            const opacity = isClosed ? '0.6' : '1';
            const buttonHtml = isClosed 
                ? `<span style="color: #9ca3af; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.05em;"><i class="fas fa-archive"></i> ARCHIVED</span>`
                : `<button onclick="event.stopPropagation(); window.app.resolveRecord('${item._id}')" class="btn-text" style="color: #ef4444; border: 1px solid #fee2e2; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; background: #fef2f2; z-index: 10;"><i class="fas fa-check-circle"></i> CLOSE RECORD</button>`;

            return `
            <div class="item-card" onclick="window.app.openItemDetail('${item._id}')" style="padding: 20px; border: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; cursor: pointer; opacity: ${opacity}; background: ${isClosed ? '#f9fafb' : 'white'};">
                <div>
                    <span style="font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em; background: ${item.type === 'lost' ? '#fee2e2' : '#d1fae5'}; color: ${item.type === 'lost' ? '#ef4444' : '#10b981'}; margin-bottom: 10px; display: inline-block;">
                        ${item.type.toUpperCase()}_ITEM
                    </span>
                    <h4 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 5px; text-decoration: ${isClosed ? 'line-through' : 'none'};">${item.title}</h4>
                    <small style="color: #9ca3af;"><i class="far fa-clock"></i> Logged on ${new Date(item.createdAt).toLocaleDateString()}</small>
                </div>
                <div>${buttonHtml}</div>
            </div>
            `;
        }).join('');
    }

    openItemDetail(itemId) {
        const item = this.items.find(i => i._id === itemId);
        if (!item) return;
        
        this.currentDetailId = itemId;

        document.getElementById('detailTitle').innerText = item.title;
        document.getElementById('detailId').innerText = item._id.toUpperCase();
        document.getElementById('detailDescription').innerText = item.description;
        document.getElementById('detailLocation').innerText = item.location;
        document.getElementById('detailCategory').innerText = item.category;
        
        const reporterName = typeof item.owner === 'object' ? item.owner.name : 'Unknown User';
        document.getElementById('detailReporter').innerText = reporterName;

        const loggedDate = new Date(item.createdAt);
        const hoursAgo = Math.floor((new Date() - loggedDate) / (1000 * 60 * 60));
        document.getElementById('detailDate').innerText = hoursAgo > 0 ? `about ${hoursAgo} hours ago` : 'Just now';

        const badge = document.getElementById('detailBadge');
        if (item.type === 'lost') {
            badge.innerText = 'LOST';
            badge.style.background = '#fee2e2';
            badge.style.color = '#ef4444';
        } else {
            badge.innerText = 'FOUND';
            badge.style.background = '#d1fae5';
            badge.style.color = '#10b981';
        }

        const imgEl = document.getElementById('detailImage');
        const iconEl = document.getElementById('detailPlaceholderIcon');
        if (item.image) {
            imgEl.src = `http://localhost:5000/${item.image}`;
            imgEl.style.display = 'block';
            iconEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            iconEl.style.display = 'block';
        }

        const ownerId = item.owner && typeof item.owner === 'object' ? item.owner._id : item.owner;
        const isOwner = this.currentUser && ownerId === this.currentUser.id;
        
        const hubTitle = document.getElementById('hubTitle');
        const hubText = document.getElementById('hubText');
        const hubBtnText = document.getElementById('hubBtnText');
        const hubBtn = document.getElementById('hubActionBtn');

        if (item.status === 'closed') {
            hubTitle.innerText = "RECORD ARCHIVED";
            hubText.innerText = "This entry has been finalized and securely archived in the system log.";
            hubBtnText.innerText = "RECORD CLOSED";
            hubBtn.style.background = "#9ca3af";
            hubBtn.style.cursor = "not-allowed";
        } else if (isOwner) {
            hubTitle.innerText = "REPORTER AUTHORITY HUB";
            hubText.innerText = item.type === 'lost' 
                ? "If you have safely recovered your missing item, finalize this entry to close the search log."
                : "If the rightful owner has retrieved this item, finalize this entry to maintain catalog accuracy.";
            hubBtnText.innerText = item.type === 'lost' ? "MARK AS RECOVERED" : "MARK AS CLAIMED";
            hubBtn.style.background = "var(--primary)";
            hubBtn.style.cursor = "pointer";
        } else {
            hubTitle.innerText = "PUBLIC CLAIM HUB";
            hubText.innerText = item.type === 'lost'
                ? "Have you found this item? Initiate a secure connection with the reporter to coordinate return."
                : "Is this your missing item? Initiate a secure claim request to coordinate recovery.";
            hubBtnText.innerText = item.type === 'lost' ? "CONTACT REPORTER" : "CLAIM THIS ITEM";
            hubBtn.style.background = "var(--primary)";
            hubBtn.style.cursor = "pointer";
        }

        this.showView('itemDetailPage');
        window.scrollTo(0, 0);
    }

    async handleHubAction() {
        if (!this.currentDetailId) return;
        
        const item = this.items.find(i => i._id === this.currentDetailId);
        if (item.status === 'closed') return;

        const ownerId = item.owner && typeof item.owner === 'object' ? item.owner._id : item.owner;
        const isOwner = this.currentUser && ownerId === this.currentUser.id;

        if (isOwner) {
            this.resolveRecord(this.currentDetailId);
        } else {
            const ownerName = typeof item.owner === 'object' ? item.owner.name : 'the reporter';
            alert(`Contacting ${ownerName}...\n\n(In a full production environment, this would open a secure chat or email with the user.)`);
        }
    }

    async resolveRecord(itemId) {
        if (!confirm("Are you sure you want to finalize and archive this record?")) return;

        try {
            await this.apiCall(`/items/${itemId}/resolve`, 'PUT');
            alert("Record successfully finalized and archived in your historical logs.");
            
            await this.loadItems();
            this.showView('profilePage');
            this.renderProfile();
        } catch (error) {
            alert('Failed to archive record: ' + error.message);
        }
    }

    openEditProfile() {
        if (!this.currentUser) return;
        
        document.getElementById('editName').value = this.currentUser.name;
        document.getElementById('editEmail').value = this.currentUser.email;
        
        this.showView('editProfilePage');
        window.scrollTo(0, 0);
    }

    async handleEditProfile(e) {
        e.preventDefault();
        
        const btn = document.getElementById('saveProfileBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAVING...';

        const newName = document.getElementById('editName').value;

        try {
            const data = await this.apiCall('/auth/profile', 'PUT', { name: newName });
            
            this.currentUser.name = data.user.name;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            
            document.getElementById('navUserName').innerText = this.currentUser.name;
            
            alert('Identity Core synchronized successfully.');
            
            this.showView('profilePage');
            this.renderProfile();
            
        } catch (error) {
            alert('Synchronization Failed: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new CampusTraceApp();
    window.app = app; 
});