document.addEventListener('DOMContentLoaded', function() {
    applyBackgroundSetting();
    applyTabCloakingSetting();
    applyClosingPreventionSetting();
    applyAboutBlankCloakingSetting();
    // applyPanicKeySetting();
});

function applyBackgroundSetting() {
    const savedBg = localStorage.getItem('bg');
    if (savedBg && savedBg.trim() !== '') {
        document.body.style.backgroundImage = `url('${savedBg}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
    }
}

function applyTabCloakingSetting() {
    const savedTabCloak = localStorage.getItem('tabCloak');
    if (savedTabCloak) {
        const title = localStorage.getItem('title');
        const faviconPath = localStorage.getItem('favicon');
        if (title) document.title = title;
        if (faviconPath) {
            let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = faviconPath;
            document.getElementsByTagName('head')[0].appendChild(link);
        }
        console.log('Applying tab cloak:', savedTabCloak);
    }
}

function applyClosingPreventionSetting() {
    const closeP = localStorage.getItem('close-p');
    if (closeP === 'true') {
        window.addEventListener('beforeunload', function(e) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        });
    }
}

function applyAboutBlankCloakingSetting() {
    const abcloak = localStorage.getItem('abcloak');
    if (abcloak === 'true' && window.self === window.top) {
        const newTab = window.open('about:blank', '_blank');
        newTab.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head><title>Iframe Wrapper</title></head>
            <body style="margin:0; padding:0; height:100vh; overflow:hidden; background:#000;">
                <iframe src="${window.location.href}" style="border:none; width:100vw; height:100vh;"></iframe>
            </body>
            </html>
        `);
        newTab.document.close();
        // console.log('About:blank cloaking is enabled');
    }
}
