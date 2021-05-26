var preview, canvas, ctx, output, fields;

addLoadEvent(onPageLoaded)

function onPageLoaded(){
    var uploader = document.getElementById("file-upload")

    output = document.getElementById("output");
    canvas = document.getElementById("canvas");
    
    ctx = canvas.getContext('2d');

    var download = document.getElementById("download")
    var encode = document.getElementById("encode")
    var decode = document.getElementById("decode")

    var inputs = [document.getElementById("file-upload-form"),document.getElementById("options")]

    fields = {}
    var image = null;

    for (const field of ["fname","message","secret","encode","decode"]){
        fields[field] = document.getElementById(field)
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

    document.getElementById("hide-output").addEventListener("click",()=>{
        output.classList.add("hidden")
    })
    document.getElementById("hide-options").addEventListener("click",()=>{
        inputs[1].classList.add("hidden")
        if (inputs[0].classList.contains("hidden"))
            inputs[0].classList.remove("hidden")
    })
    
    uploader.addEventListener("change", onUploadChanged, false)

    encode.addEventListener("click",()=>{
        encodeImage(image, ctx, fields["message"].value, fields["secret"].value)
    })

    decode.addEventListener("click",()=>{
        decodeImage(image, ctx, fields["secret"].value)
    })

    var link = document.createElement('a');
    download.addEventListener("click",()=>{
        link.download = fields["fname"].value;
        link.href = canvas.toDataURL()
        link.click();
    })
}

function toBin(item, length){
    let result = "";
    for(let i=length-1; i>=0; i--) result += (item >> i) & 1;
    return result;
}

function encodeImage(image, ctx, message, secret){
    let encrypted = CryptoJS.AES.encrypt(message, secret).toString();
    console.log(encrypted)
    let bstring = "";

    // binary header
    let pow = Math.ceil(Math.log2(encrypted.length));
    bstring += toBin(pow, 5);
    bstring += toBin(encrypted.length, pow);

    // perform sanity check to ensure message can be encoded
    if (3*image.width*image.height < (5+pow+(7*encrypted.length)))
        return false

    // encode message to binary
    for (let i = 0; i < encrypted.length; i++){
        let val = encrypted.charCodeAt(i)-43;
        bstring += toBin(val, 7);
    }

    // write binary string to canvas
    ctx.drawImage(image,0,0);
    let bits = bstring.split("");
    let [x, y] = [0, 0];
    while (bits.length > 0){
        let data = ctx.getImageData(x, y, image.width, image.height).data;
        let rgb = [data[0],data[1],data[2]];

        for (let i = 0; i < 3 && bits.length > 0; i++)
            if (bits.shift() != rgb[i]%2){
                if (rgb[i]==255){
                    rgb[i]--
                } else {
                    rgb[i]++
                }
            }
        
        ctx.fillStyle = "rgb("+rgb[0]+","+rgb[1]+","+rgb[2]+")";
        ctx.fillRect(x, y, 1, 1);

        x++;
        if (x == image.width){
            x = 0;
            y++;
        }
    }

    if (output.classList.contains("hidden")){
        output.classList.remove("hidden");
    }
}

function decodeImage(image, ctx, secret){
    let cursor = [0, 0]

    function moveCursor(){
        cursor[0]++
        if (cursor[0]==image.width){
            cursor[0] = 0;
            cursor[1]++;
        }
    }
    let bstring = "";

    // gather data from header
    while (bstring.length < 5){
        let rgb = ctx.getImageData(cursor[0], 0, image.width, image.height).data
        bstring += [rgb[0]%2 , rgb[1]%2 , rgb[2]%2].join("");
        moveCursor()
    }
    
    let pow2 = parseInt(bstring.slice(0,5),2)

    while (bstring.length < 5 + pow2){
        let rgb = ctx.getImageData(cursor[0], 0, image.width, image.height).data
        bstring += [rgb[0]%2 , rgb[1]%2 , rgb[2]%2].join("");
        moveCursor()
    }

    length = parseInt(bstring.slice(5, 5+pow2), 2);
    
    while (bstring.length < 5+pow2+(length*7)){
        let rgb = ctx.getImageData(cursor[0], 0, image.width, image.height).data
        bstring += [rgb[0]%2 , rgb[1]%2 , rgb[2]%2].join("");
        moveCursor()
    }

    bstring = bstring.slice(5+pow2, 5+pow2+(length*7))
    let [bdata, tmp, message] = [bstring.split(""), "", ""];
    while (bdata.length > 0){
        tmp += bdata.shift();
        if (tmp.length == 7){
            let charCode = parseInt(tmp,2)+43;
            message += String.fromCharCode(charCode);
            tmp = "";
        }
    }

    message = CryptoJS.AES.decrypt(message, secret).toString(CryptoJS.enc.Utf8);
    if (message != ""){
        fields["message"].innerHTML = message;
        fields["message"].value = message;
    } else {
        alert("No encrypted message with this secret")
    }
}