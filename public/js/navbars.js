window.navbarLoaded = false;

async function loadNavbar() {
    try {
        const res = await fetch('navbars.html');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        document.getElementById('navbar-placeholder').innerHTML = await res.text();
        await new Promise(r => setTimeout(r, 50));
        await initNavbar();
        window.navbarLoaded = true;
        window.dispatchEvent(new CustomEvent('navbarReady'));
    } catch (err) {
        console.error('Navbar load failed:', err);
        setTimeout(loadNavbar, 500);
    }
}

async function initNavbar() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (!menuToggle || !sidebar || !closeSidebar || !sidebarOverlay) throw new Error('Navbar elements missing');

    menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.add('open');
        sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    });

    closeSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    });

    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    });

    const quickAppsDropdown = document.getElementById('quick-apps-dropdown');
    const quickAppsMenu = document.getElementById('quick-apps-menu');

    if (quickAppsDropdown && quickAppsMenu) {
        quickAppsDropdown.addEventListener('click', (e) => {
            e.preventDefault();
            quickAppsDropdown.classList.toggle('show');
            quickAppsMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!quickAppsDropdown.contains(e.target)) {
                quickAppsDropdown.classList.remove('show');
                quickAppsMenu.classList.remove('show');
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    initializeIconSearch();
}

function initializeIconSearch() {
    const icons = document.getElementsByClassName('icons');
    Array.from(icons).forEach(icon => {
        icon.addEventListener('click', function (e) {
            e.preventDefault();
            const dataUrl = icon.getAttribute('data-url');
            if (dataUrl) {
                const url = search(dataUrl, dataUrl);
                sessionStorage.setItem('uvUrl', url);
                sessionStorage.setItem('uvOriginalQuery', dataUrl);
                window.location.href = 'search.html';
            }
        });
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
} else {
    loadNavbar();
}
// console.log("navbars.js is running");
// function initializeNavbar() {
//     const menuToggle = document.getElementById('menu-toggle');
//     const sidebar = document.getElementById('sidebar');
//     const closeSidebar = document.getElementById('close-sidebar');
//     const sidebarOverlay = document.getElementById('sidebar-overlay');

//     if (!menuToggle || !sidebar || !closeSidebar || !sidebarOverlay) {
//         setTimeout(initializeNavbar, 100);
//         return;
//     }

//     console.log('Menu Toggle:', menuToggle);
//     console.log('Sidebar:', sidebar);
//     console.log('Close Sidebar:', closeSidebar);
//     console.log('Sidebar Overlay:', sidebarOverlay);

//     function openSidebar() {
//         if (sidebar && sidebarOverlay) {
//             sidebar.classList.add('open');
//             sidebarOverlay.classList.add('show');
//             document.body.style.overflow = 'hidden';
//         }
//     }

//     function closeSidebarFunc() {
//         if (sidebar && sidebarOverlay) {
//             sidebar.classList.remove('open');
//             sidebarOverlay.classList.remove('show');
//             document.body.style.overflow = '';
//         }
//     }

//     if (menuToggle) {
//         menuToggle.addEventListener('click', openSidebar);
//     } else {
//         console.error('Menu toggle button not found');
//     }

//     if (closeSidebar) {
//         closeSidebar.addEventListener('click', closeSidebarFunc);
//     } else {
//         console.error('Close sidebar button not found');
//     }

//     if (sidebarOverlay) {
//         sidebarOverlay.addEventListener('click', closeSidebarFunc);
//     } else {
//         console.error('Sidebar overlay not found');
//     }

//     const quickAppsDropdown = document.getElementById('quick-apps-dropdown');
//     const quickAppsMenu = document.getElementById('quick-apps-menu');

//     if (quickAppsDropdown && quickAppsMenu) {
//         quickAppsDropdown.addEventListener('click', (e) => {
//             e.preventDefault();
//             quickAppsDropdown.classList.toggle('show');
//             quickAppsMenu.classList.toggle('show');
//         });

//         document.addEventListener('click', (e) => {
//             if (!quickAppsDropdown.contains(e.target)) {
//                 quickAppsDropdown.classList.remove('show');
//                 quickAppsMenu.classList.remove('show');
//             }
//         });

//         quickAppsMenu.addEventListener('click', (e) => {
//             e.stopPropagation();
//         });
//     } else {
//         console.error('Dropdown elements not found');
//     }

//     document.addEventListener('keydown', (e) => {
//         if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
//             sidebar.classList.remove('open');
//             sidebarOverlay.classList.remove('show');
//             document.body.style.overflow = '';
//         }
//     });
// }

function search_icons() {
    const icons = document.getElementsByClassName('icons');
    Array.from(icons).forEach(icon => {
        icon.addEventListener('click', function () {
            // window.location.href = 'https://google.com';
            const dataUrl = icon.getAttribute('data-url');
            const url = search(dataUrl, dataUrl);
            sessionStorage.setItem('uvUrl', url);
            sessionStorage.setItem('uvOriginalQuery', dataUrl);
            window.location.href = 'search.html';
            console.log("redirecting to search page");
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initializeNavbar();
    search_icons();
});
// document.addEventListener('DOMContentLoaded', initializeNavbar);
