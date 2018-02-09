/*! Built with http://stenciljs.com */
(function(win, doc, appNamespace, urlNamespace, publicPath, appCore, appCoreSsr, appCorePolyfilled, hydratedCssClass, components) {

function init(win, doc, appNamespace, urlNamespace, publicPath, appCore, appCorePolyfilled, hydratedCssClass, components, x, y) {
    // create global namespace if it doesn't already exist
    (win[appNamespace] = win[appNamespace] || {}).components = components;
    y = components.filter(function (c) { return c[2]; }).map(function (c) { return c[0]; });
    if (y.length) {
        // auto hide components until they been fully hydrated
        // reusing the "x" and "i" variables from the args for funzies
        x = doc.createElement('style');
        x.innerHTML = y.join() + '{visibility:hidden}.' + hydratedCssClass + '{visibility:inherit}';
        x.setAttribute('data-styles', '');
        doc.head.insertBefore(x, doc.head.firstChild);
    }
    // get this current script
    // script tag cannot use "async" attribute
    x = doc.scripts[doc.scripts.length - 1];
    if (x && x.src) {
        y = x.src.split('/').slice(0, -1);
        publicPath = (y.join('/')) + (y.length ? '/' : '') + urlNamespace + '/';
    }
    // request the core this browser needs
    // test for native support of custom elements and fetch
    // if either of those are not supported, then use the core w/ polyfills
    // also check if the page was build with ssr or not
    x = doc.createElement('script');
    x.src = publicPath + ((!urlContainsFlag(win) && supportsCustomElements(win) && supportsEsModules(x) && supportsFetch(win) && supportsCssVariables(win)) ? appCore : appCorePolyfilled);
    x.setAttribute('data-path', publicPath);
    x.setAttribute('data-namespace', urlNamespace);
    doc.head.appendChild(x);
}
function urlContainsFlag(win) {
    return win.location.search.indexOf('core=es5') > -1;
}
function supportsEsModules(scriptElm) {
    // detect static ES module support
    const staticModule = 'noModule' in scriptElm;
    if (!staticModule) {
        return false;
    }
    // detect dynamic import support
    try {
        new Function('import("")');
        return true;
    }
    catch (err) {
        return false;
    }
}
function supportsCustomElements(win) {
    return win.customElements;
}
function supportsFetch(win) {
    return win.fetch;
}
function supportsCssVariables(win) {
    return (win.CSS && win.CSS.supports && win.CSS.supports('color', 'var(--c)'));
}


init(win, doc, appNamespace, urlNamespace, publicPath, appCore, appCoreSsr, appCorePolyfilled, hydratedCssClass, components);

})(window, document, "aikuma","aikuma","/build/aikuma/","aikuma.core.js","es5-build-disabled.js","hydrated",[["aikuma-gestate","aikuma-gestate",1,[["clearAll",6],["el",7],["getGestures",6],["loadGestures",6],["playGestures",6],["record",6],["size",1],["stopPlay",6],["stopRecord",6]],1],["aikuma-image-gesture-voice","aikuma-gestate",1,[["el",7],["state",5]],1,[["slideSize","slideSizeHandler"],["slideEvent","slideEvenHandler"]]],["aikuma-slide-show","aikuma-gestate",1,[["el",7],["getCurrent",6],["imagesizes",5],["loadImages",6],["slideTo",6],["slides",5]],1],["aikuma-translate-igv","aikuma-gestate",1,0,1]]);