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
    fields["message"].innerHTML = message;
    fields["message"].value = message;
}