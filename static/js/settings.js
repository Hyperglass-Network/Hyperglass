document.addEventListener('DOMContentLoaded', function() {
    const closePToggle = document.getElementById('close-p-toggle');
    const savedCloseP = localStorage.getItem('close-p');
    closePToggle.checked = savedCloseP === null ? true : savedCloseP === 'false';
    closePToggle.addEventListener('change', function() {
        localStorage.setItem('close-p', this.checked);
        setTimeout(() => {
            location.reload();
        }, 250);
    });

    const abcloakToggle = document.getElementById('abcloak-toggle');
    const savedAbcloak = localStorage.getItem('abcloak');
    abcloakToggle.checked = savedAbcloak === null ? true : savedAbcloak === 'true';
    abcloakToggle.addEventListener('change', function() {
        localStorage.setItem('abcloak', this.checked);
        applyAboutBlankCloakingSetting();
    });

    const savedBg = localStorage.getItem('bg');
    if (savedBg) {
        document.getElementById('bg-url').value = savedBg;
    }

    const savedEngine = localStorage.getItem('engine');
    if (savedEngine) {
        document.getElementById('search-engine').value = savedEngine;
    }

    const savedProxy = localStorage.getItem('proxy');
    if (savedProxy) {
        document.getElementById('proxy-select').value = savedProxy;
    }

    const savedWisp = localStorage.getItem('wisp');
    if (savedWisp) {
        const wispSelect = document.getElementById('wisp-select');
        const customWispInput = document.getElementById('custom-wisp');
        const isCustom = !['wisp1', 'wisp2', 'wisp3'].includes(savedWisp);
        if (isCustom) {
            wispSelect.value = 'custom';
            customWispInput.value = savedWisp;
        } else {
            wispSelect.value = savedWisp;
        }
    }

});

// previous panic key code from elsewhere
// function applyPanicKeySetting() {
//     const panicKey = localStorage.getItem('panicKey');
//     const panicUrl = localStorage.getItem('panicUrl');

//     if (panicKey && panicUrl) {
//         document.removeEventListener('keydown', panicKeyHandler);
//         window.panicKeyHandler = function(e) {
//             if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
//                 return;
//             }

//             if (e.key === panicKey || e.key === panicKey.toLowerCase() || e.key === panicKey.toUpperCase()) {
//                 e.preventDefault();
//                 window.location.href = panicUrl;
//             }
//         };
//         document.addEventListener('keydown', window.panicKeyHandler);
//     }
// }