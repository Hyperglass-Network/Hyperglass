// Sidebar functionality
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('close-sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeSidebarFunc() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

menuToggle.addEventListener('click', openSidebar);
closeSidebar.addEventListener('click', closeSidebarFunc);
sidebarOverlay.addEventListener('click', closeSidebarFunc);

// Quick Apps dropdown
const quickAppsDropdown = document.getElementById('quick-apps-dropdown');
const quickAppsMenu = document.getElementById('quick-apps-menu');

quickAppsDropdown.addEventListener('click', (e) => {
    e.preventDefault();
    quickAppsDropdown.classList.toggle('show');
    quickAppsMenu.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!quickAppsDropdown.contains(e.target)) {
        quickAppsDropdown.classList.remove('show');
        quickAppsMenu.classList.remove('show');
    }
});

// Prevent dropdown from closing when clicking inside
quickAppsMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});