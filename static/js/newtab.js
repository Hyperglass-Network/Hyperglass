document.addEventListener('DOMContentLoaded', () => {
    const openWindowBtn = document.getElementById('open-window');
    
    if (openWindowBtn) {
        openWindowBtn.addEventListener('click', () => {
            const frame = document.getElementById('uv-frame');
            
            if (frame && frame.src && frame.src !== 'about:blank') {
                const originalQuery = sessionStorage.getItem('uvOriginalQuery');
                const currentUrl = sessionStorage.getItem('uvUrl');
                const newTab = window.open('about:blank', '_blank');
                
                if (newTab) {
                    const htmlContent = `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <!-- <title>${originalQuery || 'HyperGlass'}</title> -->
                        <title>Google</title>
                        <link rel="icon" href="https://www.google.com/favicon.ico">
                        <style>
                            body, html { 
                                margin: 0; 
                                padding: 0; 
                                height: 100vh; 
                                overflow: hidden;
                                background: #000;
                            }
                            iframe { 
                                border: none; 
                                width: 100%; 
                                height: 100%; 
                                display: block;
                            }
                        </style>
                        <script src="/baremux/index.js"></script>
                        <script src="/uv/uv.bundle.js"></script>
                        <script src="/uv/uv.config.js"></script>
                    </head>
                    <body>
                        <iframe id="proxy-frame"></iframe>
                        <script>
                            (async () => {
                                try {
                                    const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
                                    const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
                                    
                                    if (await connection.getTransport() !== "/epoxy/index.mjs") {
                                        await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                                    }
                                    
                                    const frame = document.getElementById('proxy-frame');
                                    frame.src = "${frame.src}";
                                } catch (err) {
                                    console.error('Failed to setup proxy:', err);
                                    document.body.innerHTML = '<h1>Failed to load page</h1>';
                                }
                            })();
                        </script>
                    </body>
                    </html>`;
                    newTab.document.open();
                    newTab.document.write(htmlContent);
                    newTab.document.close();
                    // setTimeout(() => {
                    //     window.location.href = 'https://www.google.com';
                    // }, 200);
                } else {
                    alert('The Pop-up has been blocked! Please allow pop-ups for this site.');
                }
            } else {
                console.log('No valid iframe source found');
            }
        });
    }
});