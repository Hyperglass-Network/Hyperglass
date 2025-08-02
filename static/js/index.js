"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");
const connection = new BareMux.BareMuxConnection("/baremux/worker.js")

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Failed to register service worker.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);
	sessionStorage.setItem('uvUrl', url);
	sessionStorage.setItem('uvOriginalQuery', address.value);
	
	const isAutoSubmit = localStorage.getItem("auto-submitted") === "true" && 
	                     address.value === "customtest.tail4911e3.ts.net";
	
	if (isAutoSubmit) {
		let frame = document.getElementById("uv-frame");
		frame.style.display = "block";
		let wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
		if (await connection.getTransport() !== "/epoxy/index.mjs") {
			await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
		}
		frame.src = __uv$config.prefix + __uv$config.encodeUrl(url);
		setTimeout(() => {
			window.location.href = "search.html";
		}, 1500);
	} else {
		window.location.href = "search.html";
	}
});