// ==========================================
// 1. GLOBAL VARIABLES
// ==========================================
const API_BASE_URL = 'http://localhost:5000/api';
let currentUser = null;
let selectedFile = null;

// [NEW] Sensor Scanning Variables
let isScanning = false;
let pollingInterval = null;

// DOM elements
const navbar = document.getElementById('navbar');
const navMenu = document.getElementById('nav-menu');
const hamburger = document.getElementById('hamburger');
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // Run Dev Mode Login first (so you don't get stuck)
    checkAuthStatus();
    
    // Initialize the rest
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupForms();
    setupFileUpload();
    setupScrollEffects();
}

// ==========================================
// 3. NAVIGATION & UI SETUP
// ==========================================
function setupNavigation() {
    hamburger.addEventListener('click', toggleMobileMenu);
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('href').substring(1);
            showSection(target);
            closeMobileMenu();
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            closeMobileMenu();
        }
    });
}

function setupForms() {
    // [NEW] CONNECT THE SENSOR SYNC BUTTON
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', toggleScanning);
    }

    // Login/Signup Forms
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    
    const signupForm = document.getElementById('signup-form');
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
    
    // Crop Form
    const cropForm = document.getElementById('crop-form');
    if (cropForm) cropForm.addEventListener('submit', handleCropRecommendation);
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

function setupFileUpload() {
    const uploadArea = document.getElementById('upload-area');
    const imageInput = document.getElementById('image-input');
    const detectWeedsBtn = document.getElementById('detect-weeds-btn');
    
    if (uploadArea) {
        uploadArea.addEventListener('click', () => imageInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
    }
    
    if (imageInput) imageInput.addEventListener('change', handleImageSelect);
    if (detectWeedsBtn) detectWeedsBtn.addEventListener('click', handleWeedDetection);
}

function setupScrollEffects() {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ==========================================
// 4. NAVIGATION HELPERS
// ==========================================
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

function closeMobileMenu() {
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
}

function showSection(sectionId) {
    const protectedSections = ['crop-recommendation', 'weed-detection'];
    if (protectedSections.includes(sectionId) && !currentUser) {
        showToast('Please login to access this feature', 'warning');
        showSection('login');
        return;
    }
    
    sections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    window.scrollTo(0, 0);
}

// ==========================================
// 5. AUTHENTICATION (With Dev Mode Bypass)
// ==========================================
async function checkAuthStatus() {
    // --- DEV MODE BYPASS ---
    console.log("👨‍💻 DEV MODE: Auto-Login active");
    currentUser = { username: "Developer", email: "dev@bmsit.in" };
    updateAuthUI(true);
    showSection('home');
    return;
    // -----------------------

    /* (Original Real Auth Check - Uncomment when ready for production)
    try {
        const response = await fetch(`${API_BASE_URL}/user`, { credentials: 'include' });
        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            updateAuthUI(true);
        } else {
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        updateAuthUI(false);
    }
    */
}

function updateAuthUI(isAuthenticated) {
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    if (isAuthenticated && currentUser) {
        if (loginLink) loginLink.style.display = 'none';
        if (signupLink) signupLink.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        if (userName) userName.textContent = currentUser.username;
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (signupLink) signupLink.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
    }
}

// (Restored original Login Logic)
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            currentUser = result.user;
            updateAuthUI(true);
            showToast('Login successful!', 'success');
            showSection('home');
        } else {
            showToast(result.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
        username: formData.get('username'),
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            showToast('Account created! Logging in...', 'success');
            // Auto login simulation would go here
            showSection('login');
        } else {
            showToast(result.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Network error.', 'error');
    } finally {
        showLoading(false);
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_BASE_URL}/logout`, { method: 'POST', credentials: 'include' });
        currentUser = null;
        updateAuthUI(false);
        showToast('Logged out successfully', 'info');
        showSection('home');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ==========================================
// 6. CROP RECOMMENDATION (Restored Original)
// ==========================================
async function handleCropRecommendation(e) {
    e.preventDefault();
    if (!currentUser) {
        showToast('Please login first', 'warning');
        showSection('login');
        return;
    }
    
    const formData = new FormData(e.target);
    const data = {
        N: parseFloat(formData.get('N')),
        P: parseFloat(formData.get('P')),
        K: parseFloat(formData.get('K')),
        temperature: parseFloat(formData.get('temperature')),
        humidity: parseFloat(formData.get('humidity')),
        ph: parseFloat(formData.get('ph')),
        rainfall: parseFloat(formData.get('rainfall'))
    };
    
    if (!validateCropInputs(data)) return;
    
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/crop-recommendation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok) {
            displayCropResult(result);
            showToast('Recommendation generated!', 'success');
        } else {
            showToast(result.error || 'Failed', 'error');
        }
    } catch (error) {
        console.error('Crop error:', error);
        showToast('Network error.', 'error');
    } finally {
        showLoading(false);
    }
}

function validateCropInputs(data) {
    const requiredFields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
    for (const field of requiredFields) {
        if (isNaN(data[field])) {
            showToast(`Invalid value for ${field}`, 'error');
            return false;
        }
    }
    return true;
}

function displayCropResult(result) {
    const resultContainer = document.getElementById('crop-result');
    const recommendedCrop = document.getElementById('recommended-crop');
    const confidenceValue = document.getElementById('confidence-value');
    
    if (resultContainer && recommendedCrop && confidenceValue) {
        recommendedCrop.textContent = result.recommended_crop;
        confidenceValue.textContent = `${(result.confidence * 100).toFixed(1)}%`;
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================
// 7. WEED DETECTION (Restored Original)
// ==========================================
function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('dragover'); }
function handleDragLeave(e) { e.preventDefault(); e.currentTarget.classList.remove('dragover'); }

function handleDrop(e) { 
    e.preventDefault(); 
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
}

function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image', 'error');
        return;
    }
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImg = document.getElementById('preview-img');
        const imagePreview = document.getElementById('image-preview');
        const uploadArea = document.getElementById('upload-area');
        if (previewImg) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadArea.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

async function handleWeedDetection() {
    if (!selectedFile) {
        showToast('Select an image first', 'warning');
        return;
    }
    showLoading(true);
    try {
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const response = await fetch(`${API_BASE_URL}/weed-detection`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        const result = await response.json();
        if (response.ok && result.result_image) {
            displayWeedResult(result);
            showToast('Weeds detected!', 'success');
        } else {
            throw new Error(result.error || 'Detection failed');
        }
    } catch (error) {
        console.error('Weed detection error:', error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function displayWeedResult(result) {
    const resultContainer = document.getElementById('weed-result');
    const resultImg = document.getElementById('result-img');
    const weedCount = document.getElementById('weed-count');
    
    if (resultContainer) {
        resultImg.src = `data:image/jpeg;base64,${result.result_image}`;
        weedCount.textContent = result.detections;
        resultContainer.style.display = 'block';
        resultContainer.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==========================================
// 8. NEW: SENSOR START/STOP & POLLING
// ==========================================
async function toggleScanning() {
    const syncBtn = document.getElementById('sync-btn');
    
    // 1. Toggle State
    isScanning = !isScanning;
    
    // 2. Update UI
    if (isScanning) {
        syncBtn.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Scanning';
        syncBtn.style.backgroundColor = "#e74c3c"; // Red
        showToast("Starting System...", "success");
    } else {
        syncBtn.innerHTML = '<i class="fas fa-wifi"></i> Start Scanning';
        syncBtn.style.backgroundColor = "#2196F3"; // Blue
        showToast("Stopping System...", "info");
    }

    try {
        // 3. Send command to backend
        const response = await fetch(`${API_BASE_URL}/toggle-scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scanning: isScanning })
        });
        
        // 4. Handle Auto-Polling
        if (isScanning) {
            if (pollingInterval) clearInterval(pollingInterval);
            pollingInterval = setInterval(fetchSensorData, 2000);
        } else {
            if (pollingInterval) clearInterval(pollingInterval);
        }

    } catch (error) {
        console.error("Backend Error:", error);
        showToast("Backend connection failed", "error");
        isScanning = !isScanning; // Revert state
    }
}

async function fetchSensorData() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-sensor-data`);
        if (!response.ok) return;
        
        const data = await response.json();
        console.log("🌱 Auto-Update:", data);

        const fields = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall'];
        fields.forEach(field => {
            const input = document.querySelector(`input[name="${field}"]`);
            if (input && data[field] !== undefined) {
                input.value = data[field];
            }
        });
    } catch (error) {
        console.warn("Polling skipped (server offline?)");
    }
}

// ==========================================
// 9. UTILITIES & ERROR HANDLING
// ==========================================
function showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { if(toast.parentNode) toast.parentNode.removeChild(toast); }, 2500);
}

// Global Error Handler
const originalFetch = window.fetch;
window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
        console.error('Fetch error:', error);
        // Don't show toast for every polling error to avoid spam
        if (!args[0].includes('get-sensor-data')) {
            showToast('Network error.', 'error');
        }
        throw error;
    });
};