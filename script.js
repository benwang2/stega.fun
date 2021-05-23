var canvas, ctx;

window.addEventListener("load",onPageLoaded)

function onPageLoaded(){
    var hamburger = document.getElementById("hamburger")
    var sidebar = document.querySelector(".sidebar")
    var uploader = document.getElementById("file-upload")

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext('2d');

    var encode = document.getElementById("encode")
    var decode = document.getElementById("decode")

    var inputs = [document.getElementById("file-upload-form"),document.getElementById("options")]

    var fields = {}
    var image = null;

    for (const field of ["fname","message","secret","encode","decode"]){
        fields[field] = document.getElementById(field)
    }

    function toggleMenu(){
        if (hamburger.classList.contains("is-active")){
            hamburger.classList.remove("is-active")
            sidebar.classList.remove("show-menu")
        } else {
            hamburger.classList.add("is-active")
            sidebar.classList.add("show-menu")
        }
    }

    function onUploadChanged(e){
        var reader = new FileReader();
        reader.onload = function(event){
            image = new Image();
            image.onload = function(){
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image,0,0);
            }
            image.src = event.target.result;

            if (!inputs[0].classList.contains("hidden"))
                inputs[0].classList.add("hidden")
            if (inputs[1].classList.contains("hidden"))
                inputs[1].classList.remove("hidden")

            fields["fname"].value = e.target.files[0].name;
        }
        reader.readAsDataURL(e.target.files[0]); 
    }

    hamburger.addEventListener("click", toggleMenu)
    uploader.addEventListener("change", onUploadChanged, false)

    encode.addEventListener("click",()=>{
        encodeImage(image, ctx, fields["message"].value, fields["secret"].value)
    })
}