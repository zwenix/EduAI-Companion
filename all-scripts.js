

// ==================== INLINE SCRIPT #1 (length: 252) ====================
!function(){var e=document.documentElement,t=window.matchMedia("(prefers-color-scheme: dark)").matches,a="system";try{a=localStorage.getItem("theme")||"system"}catch(e){}var c="dark"===a||"system"===a&&t;e.style.backgroundColor=c?"#171717":"#ffffff"}()

// ==================== INLINE SCRIPT #2 (length: 265) ====================
function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied",wait_for_update:500,url_passthrough:!0,ads_data_redaction:!0})

// ==================== INLINE SCRIPT #4 (length: 131) ====================
function gtag(){dataLayer.push(arguments)}window.dataLayer=window.dataLayer||[],gtag("js",new Date),gtag("config","AW-11551851435")

// ==================== INLINE SCRIPT #5 (length: 0) ====================


// ==================== INLINE SCRIPT #6 (length: 615) ====================
var prodDomain=["internal-qwenlm.alibaba-inc.com","qwenlm.io","chat.qwenlm.ai","qwenlm.ai","qwen.ai","chat.qwen.ai","qwenchat.com"],env=prodDomain.some(e=>location.host===e)?"prod":"pre";!function(e,a,t,n){a.cookie.split(";").map(function(e){return e.trim().split("=")});var i="pre"===env?"https://pre-chat.qwen.ai/scripts/stat.js":"https://chat.qwen.ai/scripts/stat.js";e[n]=e[n]||[];var s=a.getElementsByTagName(t)[0],r=a.createElement(t);r.async=!0,r.id="beacon-aplus",r.setAttribute("exparams","aplus&sidx=aplusSidex&ckx=aplusCkx"),r.src=i,s.parentNode.insertBefore(r,s)}(window,document,"script","aplus_queue")

// ==================== INLINE SCRIPT #7 (length: 99) ====================
function resizeIframe(e){e.style.height=e.contentWindow.document.documentElement.scrollHeight+"px"}

// ==================== INLINE SCRIPT #8 (length: 792) ====================
(()=>{const e=document.documentElement,t=document.querySelector('meta[name="theme-color"]'),a=matchMedia("(prefers-color-scheme: dark)").matches;try{const e=new URL(location.href).searchParams.get("theme");"dark"!==e&&"light"!==e||(localStorage.theme=e)}catch{}localStorage.theme||(localStorage.theme="system");const o="system"===localStorage.theme?a:"dark"===localStorage.theme,c=o?"dark":"light",r=o?"#171717":"#ffffff";e.classList.add(c),e.style.backgroundColor=r,t.setAttribute("content",r),matchMedia("(prefers-color-scheme: dark)").addEventListener("change",a=>{if("system"!==localStorage.theme)return;const o=a.matches?"dark":"light";e.classList.remove("dark","light"),e.classList.add(o);const c=a.matches?"#171717":"#ffffff";e.style.backgroundColor=c,t.setAttribute("content",c)})})()

// ==================== INLINE SCRIPT #9 (length: 1597) ====================
!function(){"use strict";var e,n,t=(e=(n=navigator.userAgent).match(/Edg\/(\d+)/))?{name:"Edge",version:+e[1],min:110}:(e=n.match(/Chrome\/(\d+)/))?{name:"Chrome",version:+e[1],min:93}:(e=n.match(/Firefox\/(\d+)/))?{name:"Firefox",version:+e[1],min:105}:n.includes("Safari")&&(e=n.match(/Version\/(\d+)/))?{name:"Safari",version:+e[1],min:16}:{name:"Unknown",version:0,min:0},o=t.version>=t.min&&function(){try{return"undefined"!=typeof Symbol&&"undefined"!=typeof Promise&&"function"==typeof Object.fromEntries}catch(e){return!1}}();if(console.log("Browser detection:",t),console.log("Modern features support:",o),window.shouldLoadViteApp=o,!o){console.warn("Browser not supported, showing fallback page");var a=function(){var e=navigator.userAgent,n=/AliApp\(QWENCHAT/.test(e)?"app":/iPad|iPhone|Android/.test(e)?"h5":window.electronAPI?"desktop":"web",t=window.aplus_queue||(window.aplus_queue=[]);t.push({action:"aplus.setPageSPM",arguments:["a2ty_o01","29997202"]}),t.push({action:"aplus.appendMetaInfo",arguments:["aplus-cpvdata",{typarm1:n,typarm2:"",typarm3:window.env||"pre",typarm4:"qwen_chat",typarm5:"product",orgid:"tongyi"}]}),t.push({action:"aplus.sendPV",arguments:[{is_auto:!1},{}]});var o=document.getElementById("splash-screen"),a=document.getElementById("low-version-browser"),r=document.getElementById("root");o&&(o.style.display="none"),a&&(a.style.display="flex"),r&&(r.style.display="none");try{"function"==typeof getAPPInit&&getAPPInit()}catch(e){console.warn("getAPPInit error:",e)}};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",a):a()}}()

// ==================== INLINE SCRIPT #10 (length: 0) ====================


// ==================== INLINE SCRIPT #11 (length: 0) ====================


// ==================== INLINE SCRIPT #12 (length: 257) ====================
!function(){if(document.documentElement.classList.contains("mobile")){var e=document.documentElement.clientWidth;if(e>=576)document.documentElement.style.fontSize="16px";else{var t=e/375,n=16*Math.min(t,2);document.documentElement.style.fontSize=n+"px"}}}()

// ==================== INLINE SCRIPT #13 (length: 0) ====================


// ==================== INLINE SCRIPT #14 (length: 855) ====================
var showGetAppHandle=function(){var e=document.getElementById("get-the-app");if(e){e.style.display="none";var t=new XMLHttpRequest;t.open("GET",`${window.location.origin}/api/config`,!0),t.onreadystatechange=function(){if(4===t.readyState&&200===t.status){var n=JSON.parse(t.responseText);n&&n.features&&n.features.enable_app_download&&(e.style.display="flex")}else 4===t.readyState&&console.error("Error:",t.status,t.statusText)},t.send()}},getAPPInit=function(){showGetAppHandle();const e=document.getElementById("low-version-browser"),t=document.getElementById("downLoad_app"),n=document.querySelector(".goto_downLoad_app"),o=document.querySelector(".goBack");n.addEventListener("click",function(){e&&(e.style.display="none"),t&&(t.style.display="flex")}),o.addEventListener("click",function(){e&&(e.style.display="flex"),t&&(t.style.display="none")})}

// ==================== INLINE SCRIPT #15 (length: 1330) ====================
function loadJS(e,o){var n="script",a=document.getElementsByTagName(n)[0],r=document.createElement(n);if(r.async=1,r.src=e,r.crossOrigin=!0,o){var t=!1;r.onload=r.onreadystatechange=function(){t||r.readyState&&!/loaded|complete/.test(r.readyState)||(r.onload=r.onreadystatechange=null,t=!0,o())}}r.onerror=function(){},a.parentNode.insertBefore(r,a)}function extractDomain(e){const o=e.match(/^(https?:\/\/)?(([\w-]+\.)+[a-zA-Z]{2,})(:\d+)?(\/.*)/);return o&&o[2]?o[2]:null}function isDebugTrue(){return!!window.URLSearchParams&&"true"===new URLSearchParams(window.location.search).get("_debug")}const isMobile=()=>{const e=navigator.userAgent;return/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(e)},closeDebug=()=>!!window.URLSearchParams&&"true"===new URLSearchParams(window.location.search).get("closeDebug");("prod"!==env&&isMobile()&&!closeDebug()||"prod"===env&&isDebugTrue())&&loadJS("https://g.alicdn.com/code/lib/vConsole/3.15.1/vconsole.min.js",function(){new VConsole({defaultPlugins:["system","network","storage"]})})

// ==================== INLINE SCRIPT #17 (length: 32) ====================
window.qwen_chat_env="___env___"