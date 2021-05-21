window.addEventListener("load",onPageLoaded)

function onPageLoaded(){
    var hamburger = document.getElementById("hamburger")
    var sidebar = document.querySelector(".sidebar")

    function toggleMenu(){
        if (hamburger.classList.contains("is-active")){
            hamburger.classList.remove("is-active")
            sidebar.classList.remove("show-menu")
        } else {
            hamburger.classList.add("is-active")
            sidebar.classList.add("show-menu")
        }
    }

    hamburger.addEventListener("click", toggleMenu)
}