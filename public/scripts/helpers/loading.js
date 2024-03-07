// source: https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
function waitForHTML(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }
        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}
// waiting for loading container to load
waitForHTML('#loading-container').then(() => {
    // select everything from the body instead of the loading container
    let body = document.querySelector("body:not(#loading-container)");
    let loadingContainer = document.querySelector("#loading-container");

    // when DOM content is fully loaded, hide loading container and show the rest of the body
    document.onreadystatechange = () => {
        if (document.readyState !== "complete") {
            // DOM isn't fully loaded
            let img = new Image();
            // waiting for image in the loading container to achieve smooth looking animation
            img.addEventListener('load', () => {
                body.style.visibility = "hidden";
                loadingContainer.style.visibility = "visible";
            });
            img.src = '/images/logo.png';
        }
        else {
            // DOM is loaded, don't display loading container anymore
            loadingContainer.style.display = "none";
            body.style.visibility = "visible";
        }
    };
});